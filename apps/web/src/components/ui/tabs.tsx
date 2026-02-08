import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = ({ value, onValueChange, defaultValue, children, className }: any) => {
    const [selected, setSelected] = React.useState(value || defaultValue);
    // Clone children to pass props if needed, or use Context. Context is better.
    return (
        <div className={cn("", className)}>
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, { value: selected, onValueChange: onValueChange || setSelected } as any);
                }
                return child;
            })}
        </div>
    )
}

const TabsList = ({ className, children }: any) => (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500", className)}>
        {children}
    </div>
)

const TabsTrigger = ({ value, children, onClick, activeValue }: any) => {
    // This is hard to wire without context. Logic above is flawed for deep nesting.
    // I'll make a context.
    return (
        <button className="px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm">
            {children}
        </button>
    )
}

const TabsContent = ({ value, children }: any) => {
    return <div>{children}</div>
}

// Simple Context Implementation
const TabsContext = React.createContext<any>(null);

const TabsRoot = ({ defaultValue, value, onValueChange, children, className }: any) => {
    const [localValue, setLocalValue] = React.useState(defaultValue);
    const currentValue = value !== undefined ? value : localValue;
    const changeValue = onValueChange || setLocalValue;

    return (
        <TabsContext.Provider value={{ value: currentValue, onValueChange: changeValue }}>
            <div className={cn("", className)}>{children}</div>
        </TabsContext.Provider>
    )
}

const TabsListImpl = ({ className, children }: any) => (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500", className)}>
        {children}
    </div>
)

const TabsTriggerImpl = ({ value, children, className }: any) => {
    const { value: selected, onValueChange } = React.useContext(TabsContext);
    const isActive = selected === value;
    return (
        <button
            type="button"
            onClick={() => onValueChange(value)}
            className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive && "bg-white text-slate-950 shadow-sm", className)}
        >
            {children}
        </button>
    )
}

const TabsContentImpl = ({ value, children, className }: any) => {
    const { value: selected } = React.useContext(TabsContext);
    if (selected !== value) return null;
    return <div className={cn("mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2", className)}>{children}</div>
}

export { TabsRoot as Tabs, TabsListImpl as TabsList, TabsTriggerImpl as TabsTrigger, TabsContentImpl as TabsContent }
