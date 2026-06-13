import DirectorNav from '@/components/director/DirectorNav'

export default function DirectorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <DirectorNav />
    </div>
  )
}
