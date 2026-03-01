import { createClient } from '@/lib/supabase/server'
import { getMaterials } from '@/app/actions/materials'
import { LessonMaterialsSection } from '@/components/materials/lesson-materials-section'
import { StudentDocsSection } from '@/components/materials/student-docs-section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Student } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

async function fetchStudents(): Promise<Student[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('status', 'active')
    .order('name_ko')
  if (error || !data) return []
  return data as Student[]
}

export default async function MaterialsPage() {
  const [materialsResult, students] = await Promise.all([
    getMaterials(),
    fetchStudents(),
  ])

  const materials = materialsResult.success ? materialsResult.data : []

  return (
    <div className="flex flex-col gap-6">
      <h2 data-testid="page-title" className="text-2xl font-bold tracking-tight">자료 관리</h2>
      <Tabs defaultValue="lesson" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="lesson" data-testid="tab-lesson">
            수업교재
          </TabsTrigger>
          <TabsTrigger value="student" data-testid="tab-student">
            학생자료
          </TabsTrigger>
        </TabsList>
        <TabsContent value="lesson">
          <LessonMaterialsSection initialMaterials={materials} />
        </TabsContent>
        <TabsContent value="student">
          <StudentDocsSection students={students} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
