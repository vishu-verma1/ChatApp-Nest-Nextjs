"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from "next/link"
import axios, { AxiosError } from "axios"
import { useEffect, useState } from "react"
import { useDebounceCallback } from 'usehooks-ts'
import { useRouter } from "next/navigation"
import { signUpShema } from "@/schemas/sign-upSchema"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"


const SignUp = () => {
    const [username, setUsername] = useState('');
    const [usernameMessage, setUsernameMessage] = useState('');
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [isSubmiting, setIsSubmiting] = useState(false);
    const debounced = useDebounceCallback(setUsername, 3000)
    const router = useRouter();

    const form = useForm<z.infer<typeof signUpShema>>({
        resolver: zodResolver(signUpShema),
        defaultValues: {
            username: "",
            email: '',
            password: ''
        }
    })

   


    const onSubmit = async (data: z.infer<typeof signUpShema>) => {
        setIsSubmiting(true);
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_API_URL}auth/sign-up`, data);
            if (response.status === 201) {
                localStorage.setItem('token', response.data.access_token);
                toast("Registerd", { description: response.data.message })
                router.push('/')
            }
           

        } catch (error) {
            if (axios.isAxiosError(error)) {

                if (error.response) {
                    toast("Failed",{
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



    useEffect(() => {
        const checkUsername = async () => {
            try {
                setIsCheckingUsername(true);
                const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_API_URL}auth/valid-username?username=${username}`);
                setUsernameMessage(response.data.message);

            } catch (error) {
                console.error("Error checking username:", error);
                setUsernameMessage("Error checking username");
            } finally {
                setIsCheckingUsername(false);
            }
        };

        if (username) {
            checkUsername();
        }
    }, [username]);

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
                            name="username"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>

                                        <Input placeholder="Enter Username"
                                            {...field}
                                            onChange={(e) => {
                                                field.onChange(e)
                                                debounced(e.target.value)
                                            }}

                                        />
                                    </FormControl>
                                    {isCheckingUsername && <Loader2 className="animate-spin" />}
                                    <p className={`text-sm ${usernameMessage === "Username is available and unique" ? 'text-green-500' : 'text-red-500'} `}>{usernameMessage}</p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            name="email"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>

                                        <Input placeholder="Enter Email address"
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
                                isSubmiting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Please Wait...</>) : ('Signup')
                            }
                        </Button>
                    </form>
                </Form>


                <div className="text-center mt-4">
                    <p>Already a member ? {' '}
                        <Link href={'/sign-in'} className="text-blue-500 hover:text-blue-700">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default SignUp