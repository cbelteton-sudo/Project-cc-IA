
import * as React from "react"
import { cn } from "@/lib/utils"

// Simple Popover implementation using basic state for MVP (Not robust positioning)
const Popover = ({ children }: any) => {
    const [open, setOpen] = React.useState(false);
    return (
        <div className="relative inline-block text-left">
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    // @ts-ignore
                    return React.cloneElement(child, { open, setOpen });
                }
                return child;
            })}
        </div>
    )
};

const PopoverTrigger = ({ asChild, children, open, setOpen }: any) => {
    const child = asChild ? React.Children.only(children) : <button>{children}</button>;
    return React.cloneElement(child, {
        onClick: (e: any) => {
            e.stopPropagation();
            setOpen(!open);
        }
    });
}

const PopoverContent = ({ children, className, align = 'center', open, setOpen }: any) => {
    if (!open) return null;

    React.useEffect(() => {
        const handleClickOutside = () => setOpen(false);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [setOpen]);

    return (
        <div
            onClick={e => e.stopPropagation()}
            className={cn(
                "absolute z-50 mt-2 rounded-md border bg-white shadow-md outline-none animate-in fade-in-0 zoom-in-95",
                align === 'end' ? 'right-0' : 'left-0',
                className
            )}>
            {children}
        </div>
    )
}

export { Popover, PopoverTrigger, PopoverContent }
