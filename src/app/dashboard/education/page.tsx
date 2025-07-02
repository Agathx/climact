'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GamifiedLearningTrails } from "@/components/gamified-learning-trails";
import { BookOpen, Trophy, Users, FileText } from "lucide-react";

export default function EducationPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Centro Educacional ClimACT</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Torne-se um cidadão mais preparado e consciente através de nossa plataforma educacional gamificada. 
          Aprenda sobre prevenção, resposta a emergências e ação comunitária.
        </p>
      </div>

      <Tabs defaultValue="trails" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trails" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Trilhas Gamificadas
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Cursos
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Comunidade
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Recursos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trails" className="mt-6">
          <GamifiedLearningTrails />
        </TabsContent>

        <TabsContent value="courses" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <BookOpen className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold mb-2">Primeiros Socorros Climáticos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Aprenda técnicas básicas de primeiros socorros para emergências climáticas.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600 font-medium">Duração: 2h</span>
                <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                  Iniciar
                </button>
              </div>
            </div>
            
            <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <BookOpen className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold mb-2">Prevenção de Desastres</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Entenda como identificar riscos e prevenir desastres ambientais.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600 font-medium">Duração: 3h</span>
                <button className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                  Iniciar
                </button>
              </div>
            </div>
            
            <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <BookOpen className="w-8 h-8 text-orange-600 mb-3" />
              <h3 className="font-semibold mb-2">Sustentabilidade Urbana</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Práticas sustentáveis para reduzir impacto ambiental na cidade.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600 font-medium">Duração: 4h</span>
                <button className="text-xs bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700">
                  Iniciar
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="community" className="mt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Grupos de Estudo
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-sm">Resposta a Emergências SP</p>
                      <p className="text-xs text-muted-foreground">24 membros ativos</p>
                    </div>
                    <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded">
                      Participar
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-sm">Sustentabilidade Urbana</p>
                      <p className="text-xs text-muted-foreground">18 membros ativos</p>
                    </div>
                    <button className="text-xs bg-green-600 text-white px-3 py-1 rounded">
                      Participar
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  Ranking da Comunidade
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-yellow-800">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Ana Silva</p>
                      <p className="text-xs text-muted-foreground">2.840 pontos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-800">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Carlos Santos</p>
                      <p className="text-xs text-muted-foreground">2.120 pontos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-orange-800">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Maria Oliveira</p>
                      <p className="text-xs text-muted-foreground">1.890 pontos</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Discussões Recentes</h3>
              <div className="space-y-4">
                <div className="flex gap-3 p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Como lidar com alagamentos em casa?</p>
                    <p className="text-xs text-muted-foreground">por João Costa • há 2 horas • 8 respostas</p>
                  </div>
                  <button className="text-xs text-blue-600 hover:underline">Ver discussão</button>
                </div>
                <div className="flex gap-3 p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Dicas de sustentabilidade no condomínio</p>
                    <p className="text-xs text-muted-foreground">por Maria Silva • há 1 dia • 12 respostas</p>
                  </div>
                  <button className="text-xs text-blue-600 hover:underline">Ver discussão</button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <FileText className="w-8 h-8 text-red-600 mb-3" />
                <h3 className="font-semibold mb-2">Guia de Emergências</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manual completo de procedimentos para diferentes tipos de emergências climáticas.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">PDF • 2.5 MB</span>
                  <button className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                    Download
                  </button>
                </div>
              </div>
              
              <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <FileText className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-semibold mb-2">Kit de Preparação</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Lista completa de itens essenciais para kit de emergência domiciliar.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">PDF • 1.2 MB</span>
                  <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                    Download
                  </button>
                </div>
              </div>
              
              <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <FileText className="w-8 h-8 text-green-600 mb-3" />
                <h3 className="font-semibold mb-2">Cartilha de Sustentabilidade</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Práticas sustentáveis para reduzir impactos ambientais no dia a dia.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">PDF • 3.1 MB</span>
                  <button className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                    Download
                  </button>
                </div>
              </div>
              
              <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <FileText className="w-8 h-8 text-orange-600 mb-3" />
                <h3 className="font-semibold mb-2">Plano de Evacuação</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Como criar e executar planos de evacuação para diferentes cenários.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">PDF • 1.8 MB</span>
                  <button className="text-xs bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700">
                    Download
                  </button>
                </div>
              </div>
              
              <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <FileText className="w-8 h-8 text-purple-600 mb-3" />
                <h3 className="font-semibold mb-2">Primeiros Socorros</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Técnicas básicas de primeiros socorros para situações de emergência.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">PDF • 4.2 MB</span>
                  <button className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700">
                    Download
                  </button>
                </div>
              </div>
              
              <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <FileText className="w-8 h-8 text-teal-600 mb-3" />
                <h3 className="font-semibold mb-2">Comunicação de Risco</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Como comunicar efetivamente riscos e alertas para a comunidade.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">PDF • 2.9 MB</span>
                  <button className="text-xs bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700">
                    Download
                  </button>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Vídeos Educativos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-3 p-3 bg-gray-50 rounded">
                  <div className="w-16 h-12 bg-gray-300 rounded flex items-center justify-center">
                    <span className="text-xs">▶</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Como se preparar para alagamentos</p>
                    <p className="text-xs text-muted-foreground">Duração: 8:32</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 bg-gray-50 rounded">
                  <div className="w-16 h-12 bg-gray-300 rounded flex items-center justify-center">
                    <span className="text-xs">▶</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Técnicas de primeiros socorros</p>
                    <p className="text-xs text-muted-foreground">Duração: 12:45</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
