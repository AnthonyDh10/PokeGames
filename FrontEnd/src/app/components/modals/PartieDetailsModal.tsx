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
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="max-w-3xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <Card
          showHeader
          headerColor={colors.brand.blueDeep}
          pokeballOpacity={0}
          borderColor={colors.brand.blueDeep}
          className="border-4 overflow-hidden flex flex-col"
          header={
            <div className="flex items-center justify-between w-full">
              <h3 className="font-display text-lg tracking-widest text-white uppercase">
                Détails de la partie
              </h3>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white text-2xl leading-none transition-colors"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
          }
        >
          <div className="overflow-y-auto p-4 sm:p-6">
            {isSolo ? (
              <StatDetails data={currentPokemon} color={colors.brand.blue} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        className="font-display text-xs mb-3 uppercase tracking-wider font-bold"
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
  if (loading) return <div className="font-heading animate-pulse text-orange-500 py-4">⏳ EN ATTENTE DU JOUEUR...</div>
  if (!data) return <div className="font-heading text-gray-300 py-4">AUCUNE DONNÉE</div>

  return (
    <div className="space-y-4 font-heading uppercase tracking-widest">
      <div className="flex justify-between items-end border-b-4 border-dashed pb-2" style={{ borderColor: color }}>
        <span className={`font-bold text-sm ${data.wasGuessed ? 'text-green-600' : 'text-red-500'}`}>
          {data.wasGuessed ? '► RÉUSSI' : 'X ÉCHEC'}
        </span>
        <span className="text-2xl font-bold" style={{ color }}>
          {data.pointsEarned} <small className="text-xs">PTS</small>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div
          className="p-2 bg-white border-2 transition-transform hover:-translate-y-0.5"
          style={{ borderColor: color, boxShadow: `3px 3px 0px ${color}` }}
        >
          <div className="text-[10px] text-gray-500 mb-1">TENTATIVE(S)</div>
          <div className="font-bold text-lg text-gray-800">{data.attemptsUsed} / 3</div>
        </div>

        <div
          className="p-2 bg-white border-2 transition-transform hover:-translate-y-0.5"
          style={{ borderColor: color, boxShadow: `3px 3px 0px ${color}` }}
        >
          <div className="text-[10px] text-gray-500 mb-1">INDICE(S) UTILISÉ(S)</div>
          <div className="font-bold text-lg text-gray-800">{data.hintsUsed.length}</div>
        </div>
      </div>

      {data.hintsUsed.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {data.hintsUsed.map((h: string) => (
            <span
              key={h}
              className="text-[10px] px-2 py-1 bg-gray-100 border-2 border-gray-800 text-gray-700 font-bold"
            >
              [{HINT_LABELS[h] || h}]
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
