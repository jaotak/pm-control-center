"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Role = "ADMIN" | "PM" | "DEV";

interface RoleContextType {
    role: Role;
    setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<Role>("ADMIN"); // ค่าเริ่มต้นเป็น Admin

    // โหลด Role ล่าสุดจาก LocalStorage (ถ้ามี) จะได้ไม่หลุดเวลา Refresh หน้าจอ
    useEffect(() => {
        const savedRole = localStorage.getItem("app_role") as Role;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (savedRole) setRole(savedRole);
    }, []);

    const changeRole = (newRole: Role) => {
        setRole(newRole);
        localStorage.setItem("app_role", newRole);
    };

    return (
        <RoleContext.Provider value={{ role, setRole: changeRole }}>
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    const context = useContext(RoleContext);
    if (context === undefined) {
        throw new Error("useRole must be used within a RoleProvider");
    }
    return context;
}