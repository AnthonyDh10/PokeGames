import Card from '../primitives/Card'
import { colors } from '../../design/colors'
import { HINTS_CONFIG } from '../../utils/pokedescConstants'
import type { PlayerDto, CompletedPokemonDto } from '../../types/partie'

const HINT_LABELS: Record<string, string> = Object.fromEntries(HINTS_CONFIG.map((h) => [h.key, h.label]))

const RANK_COLORS = [
  colors.brand.yellowWarm,
  colors.brand.blue,
  '#22c55e',
  '#f97316',
  '#a855f7',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
]

interface PartieDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  isSolo: boolean
  currentPokemon: CompletedPokemonDto | null | undefined
  index: number
  sortedPlayers: PlayerDto[]
  me: PlayerDto | undefined
  gameFullyComplete: boolean
}

export default function PartieDetailsModal({
  isOpen, onClose,
  isSolo, currentPokemon, index, sortedPlayers, me, gameFullyComplete,
}: PartieDetailsModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[50] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Card
          showHeader={false}
          headerColor={colors.brand.blueDeep}
          pokeballOpacity={0}
          borderColor={colors.brand.blueDeep}
          className="border-4 overflow-hidden" 
          header={
            <div className="flex w-full items-center justify-between">
              <h3 className="font-display text-lg uppercase tracking-widest text-white">
                Détails de la partie
              </h3>
            </div>
          }
        >
          <div className="max-h-[65vh] sm:max-h-[75vh] overflow-y-auto overscroll-contain p-4 sm:p-6 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2">
            
            <div className="sticky top-0 z-10 flex justify-end -mt-2 mb-2 pointer-events-none">
              <button
                onClick={onClose}
                className="pointer-events-auto flex text-2xl font-bold transition-colors hover:opacity-70"
                style={{ color: colors.brand.blueDeep }}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            {isSolo ? (
              <StatDetails data={currentPokemon} color={colors.brand.blue} />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {sortedPlayers.map((player, rank) => {
                  const playerPokemon = player.completedPokemons[index]
                  const color = RANK_COLORS[rank] ?? colors.brand.blue
                  const isMe = player.dresseurId === me?.dresseurId
                  return (
                    <div
                      key={player.dresseurId}
                      className="border-2 border-slate-100 bg-white p-4"
                      style={{ boxShadow: `3px 3px 0px ${color}`, borderColor: color }}
                    >
                      <div
                        className="font-display mb-3 text-xs font-bold uppercase tracking-wider"
                        style={{ color }}
                      >
                        {player.name}{isMe ? ' ★' : ''}
                      </div>
                      <StatDetails
                        data={playerPokemon}
                        color={color}
                        loading={!gameFullyComplete && !playerPokemon}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

interface StatDetailsProps {
  data: CompletedPokemonDto | null | undefined
  color: string
  loading?: boolean
}

function StatDetails({ data, color, loading }: StatDetailsProps) {
  if (loading) return <div className="font-heading animate-pulse py-4 text-orange-500">⏳ EN ATTENTE DU JOUEUR...</div>
  if (!data) return <div className="font-heading py-4 text-gray-300">AUCUNE DONNÉE</div>

  return (
    <div className="font-heading space-y-4 uppercase tracking-widest">
      <div className="flex items-end justify-between border-b-4 border-dashed pb-2" style={{ borderColor: color }}>
        <span className={`font-bold text-sm ${data.wasGuessed ? 'text-green-600' : 'text-red-500'}`}>
          {data.wasGuessed ? '► RÉUSSI' : 'X ÉCHEC'}
        </span>
        <span className="text-2xl font-bold" style={{ color }}>
          {data.pointsEarned} <small className="text-xs">PTS</small>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div
          className="bg-white p-2 border-2 transition-transform hover:-translate-y-0.5"
          style={{ borderColor: color, boxShadow: `3px 3px 0px ${color}` }}
        >
          <div className="mb-1 text-[10px] text-gray-500">TENTATIVE(S)</div>
          <div className="text-lg font-bold text-gray-800">{data.attemptsUsed} / 3</div>
        </div>

        <div
          className="bg-white p-2 border-2 transition-transform hover:-translate-y-0.5"
          style={{ borderColor: color, boxShadow: `3px 3px 0px ${color}` }}
        >
          <div className="mb-1 text-[10px] text-gray-500">INDICE(S) UTILISÉ(S)</div>
          <div className="text-lg font-bold text-gray-800">{data.hintsUsed.length}</div>
        </div>
      </div>

      {data.hintsUsed.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {data.hintsUsed.map((h: string) => (
            <span
              key={h}
              className="bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-700 border-2 border-gray-800"
            >
              [{HINT_LABELS[h] || h}]
            </span>
          ))}
        </div>
      )}
    </div>
  )
}