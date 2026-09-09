"use client";

import { useTransition } from "react";
import { toggleUatMandatory } from "@/app/actions/update";

export default function UATMandatoryToggle({
    uatId,
    isMandatory,
    projectId,
    disabled
}: {
    uatId: string,
    isMandatory: boolean,
    projectId: string,
    disabled: boolean
}) {
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        startTransition(() => {
            toggleUatMandatory(uatId, isMandatory, projectId);
        });
    };

    return (
        <button
            onClick={handleToggle}
            disabled={disabled || isPending}
            className={`px-2 py-1 rounded text-xs font-semibold border transition-all disabled:opacity-50 ${isMandatory
                    ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                }`}
        >
            {isPending ? "..." : isMandatory ? "บังคับผ่าน" : "ทั่วไป"}
        </button>
    );
}