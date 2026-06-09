import SaveNewBeySection from "@/components/profile/SaveNewBeySection";

export default function ProfilePage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl space-y-6">

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Profile</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage your beyblade setups</p>
        </div>

        <SaveNewBeySection />

      </div>
    </main>
  );
}
