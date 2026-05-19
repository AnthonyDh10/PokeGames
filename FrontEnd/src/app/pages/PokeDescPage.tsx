import { useParams, useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'
import { colors } from '../design/colors'
import { usePokeDesc } from '../logic/usePokeDesc'
import GameLayout from '../components/GameLayout'
import PokeDescHeader from '../components/PokeDescHeader'
import DescriptionCard from '../components/DescriptionCard'
import AnswerCard from '../components/AnswerCard'
import HintsGrid from '../components/HintsGrid'
import SuccessModal from '../components/modals/SuccessModal'
import FailureModal from '../components/modals/FailureModal'
import ZoomDescriptionModal from '../components/modals/ZoomDescriptionModal'

export default function PokeDescPage() {
  const { partieId } = useParams<{ partieId: string }>()
  const navigate = useNavigate()
  const { playerName } = useSessionStore()

  const {
    partie, isLoading, errorMessage,
    descriptions, descriptionIndex, setDescriptionIndex,
    currentPokemonId, currentScore, attemptsUsed,
    usedHints, revealedHints,
    timeRemaining, timerShake, timerFlash, showTimePenalty, currentTimePenalty, hintAnimations,
    allPokemons, filteredPokemons, searchTerm, setSearchTerm, selectedPokemonName, setSelectedPokemonName,
    isSubmitting, guessResultMessage, lastGuessCorrect, proximityResult,
    showSuccessModal, showFailureModal, showDescriptionModal, setShowDescriptionModal,
    revealedPokemonSprite, isFinalPokemon, isTimeout,
    handleSubmitGuess, handleRequestHint, proceedAfterModal, isHintLocked,
  } = usePokeDesc(partieId)

  // --- États d'affichage ---
  return (
    <GameLayout
      columns="1+1"
      isLoading={isLoading}
      error={errorMessage}
      onErrorBack={() => navigate('/pokedesc')}
      errorBackLabel="Retour au menu"
      errorBackColor={colors.brand.blue}
      header={
        <PokeDescHeader
          playerName={playerName}
          currentScore={currentScore}
          nbPokemons={partie?.nbPokemons ?? 1}
          attemptsUsed={attemptsUsed}
          selectedGenerations={partie?.selectedGenerations}
          timeRemaining={timeRemaining}
          timerDurationSeconds={partie?.timerDurationSeconds}
          timerShake={timerShake}
          timerFlash={timerFlash}
          showTimePenalty={showTimePenalty}
          currentTimePenalty={currentTimePenalty}
        />
      }
      left={
        <div className="relative z-10 flex flex-col gap-4">
          <DescriptionCard
            descriptions={descriptions}
            descriptionIndex={descriptionIndex}
            onChangeIndex={setDescriptionIndex}
            onZoom={() => setShowDescriptionModal(true)}
          />
          <AnswerCard
            filteredPokemons={filteredPokemons}
            searchTerm={searchTerm}
            selectedPokemonName={selectedPokemonName}
            isSubmitting={isSubmitting}
            guessResultMessage={guessResultMessage}
            lastGuessCorrect={lastGuessCorrect}
            proximityResult={proximityResult}
            onSearchChange={setSearchTerm}
            onSelectPokemon={(name) => { setSelectedPokemonName(name); setSearchTerm(name) }}
            onClearSelection={() => { setSelectedPokemonName(''); setSearchTerm('') }}
            onSubmit={handleSubmitGuess}
          />
        </div>
      }
      right={
        <HintsGrid
          usedHints={usedHints}
          revealedHints={revealedHints}
          hintAnimations={hintAnimations}
          timeRemaining={timeRemaining}
          timerDurationSeconds={partie?.timerDurationSeconds}
          onRequestHint={handleRequestHint}
          isHintLocked={isHintLocked}
        />
      }
      modals={
        <>
          <SuccessModal
            show={showSuccessModal}
            sprite={revealedPokemonSprite}
            pokemonName={selectedPokemonName}
            isFinalPokemon={isFinalPokemon}
            onProceed={proceedAfterModal}
          />
          <FailureModal
            show={showFailureModal}
            sprite={revealedPokemonSprite}
            pokemonName={allPokemons.find((p) => p.id === currentPokemonId)?.nameFr ?? 'Pokémon inconnu'}
            isFinalPokemon={isFinalPokemon}
            isTimeout={isTimeout}
            onProceed={proceedAfterModal}
          />
          <ZoomDescriptionModal
            show={showDescriptionModal}
            descriptions={descriptions}
            descriptionIndex={descriptionIndex}
            onChangeIndex={setDescriptionIndex}
            onClose={() => setShowDescriptionModal(false)}
          />
        </>
      }
    />
  )
}
