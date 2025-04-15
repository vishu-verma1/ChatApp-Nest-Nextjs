"use client"

import { useRouter } from 'next/navigation';
import React, { startTransition } from 'react'
const ErrorBoundary = ({ error, reset }: { error: Error; reset: () => void }) => {
    const router = useRouter();
    const reload = () => {
        startTransition(() => {
            router.refresh()
            reset();
        })
    }
    return (
        <div> ErrorBoundary {error.message}
            <button onClick={() => reset()}>Try again</button>
        </div>

    )
}

export default ErrorBoundary


// error will comne from page.tsx,  where u are throwing an error when somthing goes wrong wil displaye here
// error takes another props that take reset function from recovering an error
// userouter and startTransition used to  recover from error it will try to rerender that component 