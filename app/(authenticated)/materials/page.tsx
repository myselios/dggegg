'use client'

import { useMaterialsPage } from '@/lib/hooks/use-materials'
import { LessonMaterialsSection } from '@/components/materials/lesson-materials-section'
import { StudentDocsSection } from '@/components/materials/student-docs-section'
import { TestLinksSection } from '@/components/materials/test-links-section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function MaterialsPage() {
  const { data, isLoading } = useMaterialsPage()

  return (
    <div className="flex flex-col gap-6">
      <h2 data-testid="page-title" className="text-2xl font-bold tracking-tight">자료 관리</h2>
      {isLoading || !data ? (
        <div className="flex flex-col gap-4">
          <div className="glass-card h-40 animate-pulse rounded-2xl" />
          <div className="glass-card h-40 animate-pulse rounded-2xl" />
        </div>
      ) : (
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
            <div className="flex flex-col gap-8">
              <LessonMaterialsSection initialMaterials={data.materials} />
              <TestLinksSection initialLinks={data.testLinks} />
            </div>
          </TabsContent>
          <TabsContent value="student">
            <StudentDocsSection students={data.students} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
