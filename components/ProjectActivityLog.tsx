import { History, UserCircle2, ChevronDown } from "lucide-react";
import Link from "next/link";

type Log = {
    id: string;
    action: string;
    createdAt: Date;
    user: { id: string; name: string; avatarUrl?: string | null; };
};

export default function ProjectActivityLog({ logs }: { logs: Log[] }) {
    // Group logs by user
    const groupedLogs: Record<string, Log[]> = {};
    logs.forEach(log => {
        const userName = log.user.name;
        if (!groupedLogs[userName]) groupedLogs[userName] = [];
        groupedLogs[userName].push(log);
    });

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <History size={20} className="text-green-600" />
                Activity Log (ประวัติการเปลี่ยนแปลง)
            </h2>

            {logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                    ยังไม่มีประวัติการทำรายการในโครงการนี้
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedLogs).map(([userName, userLogs]) => (
                        <details key={userName} className="group border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors font-bold text-gray-800 list-none select-none [&::-webkit-details-marker]:hidden">
                                <div className="flex items-center gap-3">
                                    <Link href={`/users/${userLogs[0].user.id}`} className="flex items-center gap-3 group">
                                        <div className="w-9 h-9 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 overflow-hidden border border-green-200 group-hover:ring-2 group-hover:ring-green-400 transition-all">
                                            {userLogs[0].user.avatarUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={userLogs[0].user.avatarUrl} alt="Avatar" className="w-full h-full object-cover bg-white" />
                                            ) : (
                                                <UserCircle2 size={20} />
                                            )}
                                        </div>
                                        <div className="group-hover:text-green-600 transition-colors">
                                            {userName} 
                                            <span className="text-xs text-gray-500 group-hover:text-green-500 font-normal ml-2 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                                                {userLogs.length} รายการ
                                            </span>
                                        </div>
                                    </Link>
                                </div>
                                <div className="text-gray-400 group-open:rotate-180 transition-transform duration-300">
                                    <ChevronDown size={20} />
                                </div>
                            </summary>
                            
                            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                                <div className="space-y-4">
                                    {userLogs.map((log) => (
                                        <div key={log.id} className="flex justify-between items-start text-sm pb-4 border-b border-gray-200/60 last:border-0 last:pb-0">
                                            <div className="text-gray-600 pr-4">
                                                <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mr-2 mb-0.5"></span>
                                                {log.action}
                                            </div>
                                            <div className="text-[10px] text-gray-400 whitespace-nowrap bg-white px-2 py-1 rounded border border-gray-200 shadow-xs shrink-0 font-medium">
                                                {new Date(log.createdAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </details>
                    ))}
                </div>
            )}
        </div>
    );
}