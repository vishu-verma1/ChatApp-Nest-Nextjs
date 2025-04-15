"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import * as z from "zod"
import Link from "next/link"
import axios, { AxiosError } from "axios"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react";
import { signInSchema } from "@/schemas/signInSchema"

const SignIn = () => {
    const [isSubmiting, setIsSubmiting] = useState(false);
    const router = useRouter();

    const form = useForm<z.infer<typeof signInSchema>>({
        resolver: zodResolver(signInSchema)

    })


    const onSubmit = async (data: z.infer<typeof signInSchema>) => {
        setIsSubmiting(true)
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_API_URL}auth/sign-in`, data)
            // console.log(response, "------")

            if (response.status === 201) {
                localStorage.setItem('token', response.data.access_token);
                toast("Loggedin", { description: "Logged in successfuly" })
                router.push('/chat')
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {

                if (error.response) {
                    toast("Failed", {
                        description: error.response.data.message || "Failed to sign up. Please try again."
                    });
                }
                else if (error.request) {
                    toast.error("No response from the server. Please check your internet connection.");
                } else {
                    toast.error("An unexpected error occurred. Please try again.");
                }
            } else {
                console.error("Unexpected error:", error);
                toast.error("An unexpected error occurred. Please try again.");
            }
        }
        finally {
            setIsSubmiting(false);
        }




    }


    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 rounded-lg bg-white shadow-md">
                <div className="text-center">
                    <h1 className="font-bold text-2xl tracking-tight lg:text-3xl mb-6">Join Chating Messanger</h1>
                    <p className="mb-4 ">Sign up to start the ChitChat</p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                        <FormField
                            name="email"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>

                                        <Input placeholder="Enter Email Address"
                                            {...field}
                                        />

                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            name="password"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>

                                        <Input type="password" placeholder="Enter Password"
                                            {...field}
                                        />

                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={isSubmiting}>
                            {
                                isSubmiting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Please Wait...</>) : ('Sign-in')
                            }
                        </Button>
                    </form>
                </Form>


                <div className="text-center mt-4">
                    <p>don't have an Account ? {' '}
                        <Link href={'/sign-up'} className="text-blue-500 hover:text-blue-700">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default SignIn