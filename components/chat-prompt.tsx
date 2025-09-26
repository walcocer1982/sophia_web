"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";

interface AIChatPromptProps {
    disabled?: boolean;
    onSend?: (message: string) => void;
}

export default function ChatPrompt({ disabled = false, onSend }: AIChatPromptProps) {
    const [value, setValue] = useState("");
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 72,
        maxHeight: 300,
    });

    const handleSend = () => {
        if (value.trim() && !disabled) {
            onSend?.(value.trim());
            setValue("");
            adjustHeight(true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="w-full">
            <div className="bg-gray-100 rounded-2xl p-1.5 pt-4">
                <div className="relative">
                    <div className="relative flex flex-col">
                        <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
                            <Textarea
                                value={value}
                                placeholder={disabled ? "Sophia está respondiendo..." : "Escribe tu mensaje..."}
                                className={cn(
                                    "w-full rounded-xl rounded-b-none px-4 py-3 bg-gray-100 dark:bg-white/5 border-none dark:text-white placeholder:text-gray-500 resize-none focus-visible:ring-0 focus-visible:ring-offset-0",
                                    "placeholder:text-lg",
                                    "text-lg md:text-lg",
                                    "min-h-[72px]",
                                    disabled && "bg-gray-100 cursor-not-allowed"
                                )}
                                ref={textareaRef}
                                onKeyDown={handleKeyDown}
                                onChange={(e) => {
                                    setValue(e.target.value);
                                    adjustHeight();
                                }}
                                disabled={disabled}
                            />
                        </div>

                        <div className="h-14 bg-gray-100 dark:bg-white/5 rounded-b-xl flex items-center">
                            <div className="absolute left-3 right-3 bottom-3 flex items-center justify-end w-[calc(100%-24px)]">
                                <button
                                    type="button"
                                    onClick={handleSend}
                                    className={cn(
                                        "cursor-pointer rounded-lg p-3 bg-gradient-to-r from-cyan-600 to-yellow-500 text-white transition-all duration-200",
                                        "hover:from-cyan-700 hover:to-yellow-600 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500",
                                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-cyan-600 disabled:hover:to-yellow-500"
                                    )}
                                    aria-label="Enviar mensaje"
                                    disabled={disabled || !value.trim()}
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
