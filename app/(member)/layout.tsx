import MemberNav from '@/components/member/MemberNav'

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <MemberNav />
    </div>
  )
}
