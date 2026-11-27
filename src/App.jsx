import { useEffect, useState } from 'react'
import { bakeGame } from './api'
import Kitchen from './Kitchen'
import Lobby from './Lobby'
import StudentJoin from './StudentJoin'
import { HUB_URL, SITE_NAME, SITE_TAGLINE } from './config'
import { readSession, saveSession } from './session'
import { isConfigured } from './supabase'
import { Button, CenterCard } from './ui'
import ScenarioSubmit, { ScenarioReviewPage } from './Scenarios'

// Routes:
//   /       leader: landing -> lobby -> kitchen (the projector)
//   /join   student phone: join with the code, get a team, and cook (type conversion chains) when it's your turn
// Orders are made from templates with random numbers on the server (supabase _shared/bakery.ts), so there's
// no question bank to fill.
function App() {
  const path = window.location.pathname.replace(/\/+$/, '')
  if (!isConfigured) return <NotConfigured />
  if (path === '/join') return <StudentJoin />
  if (path === '/scenarios') return <ScenarioSubmit />
  if (path === '/review') return <ScenarioReviewPage />
  return <LeaderApp />
}

function LeaderApp() {
  const [saved] = useState(readSession) // a game this tab was running before the page loaded
  const [screen, setScreen] = useState(saved ? 'restoring' : 'landing') // restoring | landing | lobby | kitchen
  const [session, setSession] = useState(null) // { gameId, hostToken, joinCode } once the game has started
  const [resume, setResume] = useState(null) // { session, teams, finalized } to rebuild the lobby
  const [lobbyNumber, setLobbyNumber] = useState(0)

  // After a refresh: ask the server for the game and put the leader back where they were
  useEffect(() => {
    if (!saved) return
    bakeGame({ action: 'get_state', game_id: saved.gameId, host_token: saved.hostToken })
      .then((data) => {
        const names = (data.teams ?? []).map((t) => t.name)
        const restored = { ...saved, joinCode: data.game.join_code }
        setResume({ session: restored, teams: names, finalized: names.length > 0 })
        if (data.game.status !== 'setup') {
          setSession(restored)
          setScreen('kitchen')
        } else {
          setScreen('lobby')
        }
      })
      .catch(() => {
        saveSession(null)
        setScreen('landing')
      })
  }, [saved])

  // Close the game: students' phones go back to the join page, and the leader starts fresh
  async function closeGame() {
    const current = session ?? resume?.session ?? readSession()
    if (current) {
      try {
        await bakeGame({ action: 'close_game', game_id: current.gameId, host_token: current.hostToken })
      } catch {
        // Already gone
      }
    }
    saveSession(null)
    setSession(null)
    setResume(null)
    setLobbyNumber((n) => n + 1)
    setScreen('lobby')
  }

  if (screen === 'restoring') {
    return <CenterCard title={SITE_NAME}><p className="mt-4 text-muted">Restoring your game…</p></CenterCard>
  }

  if (screen === 'landing') {
    return (
      <CenterCard title={SITE_NAME}>
        <p className="mt-2 text-5xl"><span className="bob">🧁</span></p>
        <p className="mt-2 font-display text-xl text-info">{SITE_TAGLINE}</p>
        <p className="mt-3 text-muted">
          Orders come into the kitchen as chemistry conversions. Write the conversion chain, get the units to cancel, and
          serve the right amount (sig figs count!) before the customer walks out.
        </p>
        <Button className="mt-6" onClick={() => setScreen('lobby')}>👩‍🍳 Open the bakery</Button>
        <a href={HUB_URL} className="mt-4 block text-sm font-bold text-info hover:brightness-125">← All games</a>
      </CenterCard>
    )
  }

  // The lobby stays mounted (just hidden) so going back and forth keeps its state
  return (
    <>
      <div hidden={screen !== 'lobby'}>
        <Lobby
          key={lobbyNumber}
          resume={resume}
          hasGame={!!session}
          onOpenKitchen={() => setScreen('kitchen')}
          onCloseGame={closeGame}
          onStart={(started) => { setSession(started); setScreen('kitchen') }}
        />
      </div>
      {session && screen === 'kitchen' && (
        <Kitchen session={session} onLobby={() => setScreen('lobby')} onNewGame={closeGame} />
      )}
    </>
  )
}

function NotConfigured() {
  return (
    <CenterCard title="Setup needed">
      <p className="mt-4 text-muted">
        Add your Supabase address and public key to <code>.env.local</code> (see <code>.env.example</code>), then restart.
      </p>
    </CenterCard>
  )
}

export default App
