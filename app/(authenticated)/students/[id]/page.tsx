import { getStudent } from '@/app/actions/students'
import { StudentTabs } from '@/components/students/student-tabs'

export const dynamic = 'force-dynamic'

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const student = await getStudent(id)

  return <StudentTabs student={student} />
}
