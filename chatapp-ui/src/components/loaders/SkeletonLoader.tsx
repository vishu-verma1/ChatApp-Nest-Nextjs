import React from 'react'
import { Skeleton } from '../ui/skeleton'

const SkeletonLoader = () => {
    return (
        <div className=" h-screen w-screen flex flex-col justify-center items-center">
            <Skeleton className="h-1/2 w-1/2 rounded-xl" />
            <div className="space-y-3 mt-2 h-1/6 w-1/2">
                <Skeleton className="h-1/2 w-full" />
                <Skeleton className="h-1/2 w-1/2" />
                <Skeleton className="h-1/2 w-1/3" />
            </div>

        </div>
    )
}

export default SkeletonLoader