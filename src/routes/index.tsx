import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Holyrics Control</h1>
        <p className="text-muted-foreground">
          Gerencie suas projeções e músicas em tempo real.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Músicas", value: "1,234", description: "Total de músicas", icon: Music },
          { title: "Playlists", value: "42", description: "Listas de reprodução", icon: PlaySquare },
          { title: "Projeções", value: "Live", description: "Estado atual", icon: Layers },
          { title: "Uptime", value: "99.9%", description: "Disponibilidade", icon: Home },
        ].map((stat) => (
          <div key={stat.title} className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
              <stat.icon className="size-4 text-primary" />
            </div>
            <div className="mt-2 flex flex-col">
              <span className="text-2xl font-bold">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.description}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Projeção Atual</h2>
          <div className="mt-4 aspect-video rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            Pré-visualização da Projeção
          </div>
        </div>
        <div className="col-span-3 rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Atividades Recentes</h2>
          <div className="mt-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="size-2 rounded-full bg-primary" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Música alterada</span>
                  <span className="text-xs text-muted-foreground">Há {i * 5} minutos</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
})

import { Music, PlaySquare, Layers, Home } from "lucide-react"


