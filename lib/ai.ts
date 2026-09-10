import { GoogleGenAI, Type } from '@google/genai';
import { prisma } from './prisma';
import fs from 'fs/promises';
import path from 'path';

export async function processAIChatMessage(messageId: string) {
    if (!process.env.GEMINI_API_KEY) {
        return;
    }

    // Initialize inside the function to ensure the env var is read at runtime
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    try {
        // 0. Fetch the message
        const message = await prisma.chatMessage.findUnique({
            where: { id: messageId }
        });
        if (!message) return;

        const { chatRoomId, senderId: userId, body: messageBody, attachmentUrl, attachmentType } = message;

        if (!process.env.GEMINI_API_KEY) {
            await sendAIResponse(chatRoomId, "ขออภัยค่ะ ระบบ AI ยังไม่ได้ตั้งค่า GEMINI_API_KEY (หรือลืม Restart Server)");
            return;
        }

        // 1. Get user and their projects for context
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                projectsOwned: true,
                projectsAssigned: true,
            }
        });

        if (!user) return;

        const allProjects = [...user.projectsOwned, ...user.projectsAssigned];
        const uniqueProjects = Array.from(new Map(allProjects.map(p => [p.id, p])).values());
        
        const projectContext = uniqueProjects.map(p => `- ${p.name} (ID: ${p.id}, Code: ${p.code})`).join('\n');

        // 2. Define tools (Function Calling)
        const createIssueTool = {
            name: "create_issue",
            description: "สร้าง Issue หรือ Bug ticket ใหม่ในโปรเจกต์",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    projectId: {
                        type: Type.STRING,
                        description: "ID ของโปรเจกต์ที่จะสร้าง Issue"
                    },
                    title: {
                        type: Type.STRING,
                        description: "รายละเอียดของปัญหา หรือบั๊กที่พบ"
                    },
                    severity: {
                        type: Type.STRING,
                        description: "ความรุนแรงของปัญหา (Low, Medium, High)"
                    }
                },
                required: ["projectId", "title", "severity"]
            }
        };

        const createTaskTool = {
            name: "create_task",
            description: "สร้าง Task หรืองานใหม่ในโปรเจกต์",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    projectId: {
                        type: Type.STRING,
                        description: "ID ของโปรเจกต์ที่จะสร้าง Task"
                    },
                    title: {
                        type: Type.STRING,
                        description: "ชื่องาน หรือสิ่งที่ต้องทำ"
                    },
                    estimatedHours: {
                        type: Type.NUMBER,
                        description: "เวลาที่คาดว่าจะใช้ทำ (ชั่วโมง) เป็นตัวเลข"
                    }
                },
                required: ["projectId", "title"]
            }
        };

        // 3. System prompt
        const systemInstruction = `คุณคือ AI Assistant ของระบบ Project Management (pm-control-center) 
หน้าที่ของคุณคือช่วยเหลือผู้ใช้ ${user.name} ในการจัดการโปรเจกต์ และสามารถพูดคุยเรื่องทั่วไป นอกเรื่อง หรือให้คำปรึกษาเรื่องอื่นๆ ได้อย่างเป็นธรรมชาติ (เสมือนเพื่อนร่วมงาน)
โปรเจกต์ที่ผู้ใช้คนนี้เกี่ยวข้องมีดังนี้:
${projectContext || "ไม่มีโปรเจกต์"}

หากผู้ใช้ต้องการให้สร้าง Issue/Bug หรือ Task ให้คุณใช้เครื่องมือ (Tool) ที่กำหนดให้
ถ้าผู้ใช้ไม่ได้ระบุว่าโปรเจกต์ไหน ให้ถามกลับก่อนเสมอเพื่อขอ Project ID หรือชื่อโปรเจกต์
ตอบกลับเป็นภาษาไทยอย่างเป็นมิตร`;

        // 4. Load attachment if exists
        let inlineData = undefined;
        if (attachmentUrl) {
            try {
                // Remove leading slash if exists
                const cleanUrl = attachmentUrl.startsWith('/') ? attachmentUrl.slice(1) : attachmentUrl;
                const filePath = path.join(process.cwd(), 'public', cleanUrl);
                const fileData = await fs.readFile(filePath);
                inlineData = {
                    data: fileData.toString("base64"),
                    mimeType: attachmentType || "application/octet-stream"
                };
            } catch (err) {
                console.error("Error reading attachment:", err);
                await sendAIResponse(chatRoomId, "ขออภัยค่ะ AI ไม่สามารถอ่านไฟล์แนบนี้ได้ หรือไฟล์อาจไม่มีอยู่ในระบบแล้ว");
                return;
            }
        }

        const contentsInput = inlineData ? [{ inlineData }, messageBody] : messageBody;

        // 5. Call Gemini
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: contentsInput,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ functionDeclarations: [createIssueTool, createTaskTool] }]
            }
        });

        // 5. Check if AI called a function
        const functionCalls = response.functionCalls;
        
        if (functionCalls && functionCalls.length > 0) {
            let replyMessage = "ดำเนินการเรียบร้อยค่ะ:\n";

            for (const call of functionCalls) {
                const args = call.args as any;
                
                if (call.name === 'create_issue') {
                    const issueCode = `AI-ISSUE-${Math.floor(1000 + Math.random() * 9000)}`;
                    const issue = await prisma.issue.create({
                        data: {
                            issueCode,
                            title: args.title,
                            severity: args.severity,
                            projectId: args.projectId,
                            status: "Open"
                        }
                    });
                    replyMessage += `- สร้าง Issue ${issue.issueCode} (${args.severity}): ${args.title}\n`;
                } 
                else if (call.name === 'create_task') {
                    const task = await prisma.task.create({
                        data: {
                            title: args.title,
                            estimatedHours: args.estimatedHours || 0,
                            projectId: args.projectId,
                            isCompleted: false
                        }
                    });
                    replyMessage += `- สร้าง Task: ${args.title}\n`;
                }
            }

            // Send tool execution result back to chat
            await sendAIResponse(chatRoomId, replyMessage);
        } else {
            // Normal text response
            const text = response.text || "ไม่สามารถตอบได้ในขณะนี้";
            await sendAIResponse(chatRoomId, text);
        }

    } catch (error: any) {
        console.error("AI Error:", error);
        
        // Ensure chatRoomId is available if it failed early
        if (error) {
            // we might not have chatRoomId if it failed before fetching message, but try block is mostly after fetching
            try {
                const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
                if (msg) {
                    await sendAIResponse(msg.chatRoomId, "ขออภัยค่ะ เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ AI: " + (error.message || "Unknown error"));
                }
            } catch(e) {}
        }
    }
}
// Module-level cache for AI user ID to avoid repeated DB lookups
let cachedAiUserId: string | null = null;

// Helper to send message as AI user
async function sendAIResponse(chatRoomId: string, body: string) {
    try {
        // Use cached AI user ID or fetch once
        if (!cachedAiUserId) {
            const aiUser = await prisma.user.findUnique({
                where: { email: "ai@control.center" },
                select: { id: true }
            });
            if (!aiUser) {
                console.error("AI User not found in database. Please run seed-ai.js");
                return;
            }
            cachedAiUserId = aiUser.id;
        }

        const now = new Date();

        // Batch: upsert membership + create message + update room in one transaction
        await prisma.$transaction([
            // Ensure AI is a member (upsert pattern via connectOrCreate not available, use raw create with catch)
            prisma.chatMember.upsert({
                where: { chatRoomId_userId: { chatRoomId, userId: cachedAiUserId } },
                create: { chatRoomId, userId: cachedAiUserId },
                update: {},
            }),
            prisma.chatMessage.create({
                data: {
                    chatRoomId,
                    senderId: cachedAiUserId,
                    body,
                    createdAt: now,
                }
            }),
            prisma.chatRoom.update({
                where: { id: chatRoomId },
                data: { updatedAt: now }
            }),
        ]);
    } catch (err) {
        console.error("Failed to send AI message:", err);
    }
}
