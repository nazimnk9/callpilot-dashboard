"use client"

import React, { useState, useEffect } from 'react'
import { Client as Styletron } from 'styletron-engine-atomic'
import { Provider as StyletronProvider } from 'styletron-react'
import { LightTheme, BaseProvider } from 'baseui'

const getEngine = () => {
    return new Styletron()
}

export function BaseUIProvider({ children }: { children: React.ReactNode }) {
    const [engine, setEngine] = useState<any>(null)

    useEffect(() => {
        setEngine(getEngine())
    }, [])

    if (!engine) return <>{children}</>

    return (
        <StyletronProvider value={engine}>
            <BaseProvider theme={LightTheme}>
                {children}
            </BaseProvider>
        </StyletronProvider>
    )
}
