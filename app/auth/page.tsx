import { Card } from "@/components/ui/card";
import { getUser } from "@/lib/auth-session";
import Image from "next/image";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth"; // path to your auth file

export default async function Auth() {
  const session = await getUser();

  if (!session) {
    return (
      <Card className="max-w-md mx-auto mt-16 p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Not signed in</h2>
        <p className="mb-6">Please sign in to view your account.</p>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto w-[90%]">
      <div className="flex flex-col items-center">
        {session.image && (
          <Image
            src={session.image}
            alt={session.name || "User"}
            width={80}
            height={80}
            className="rounded-full mb-4"
          />
        )}
        <h2 className="text-2xl font-bold mb-2">{session.name}</h2>
        <p className="text-gray-500 mb-4">{session.email}</p>
        <div className="w-full border-t my-4" />
        <form>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            formAction={async () => {
              "use server";
              await auth.api.signOut({
                headers: await headers(),
              });
              redirect("/auth/signin");
            }}
          >
            Sign out
          </button>
        </form>
      </div>
    </Card>
  );
}
