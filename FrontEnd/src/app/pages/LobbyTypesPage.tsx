import LobbyPage from '../components/game/LobbyPage'
import { colors } from '../design/colors'

const THEME = {
  primary: colors.brand.yellow,
  primaryLight: colors.brand.yellowLight,
  primaryDark: colors.brand.yellowWarm,
  textOnColor: colors.ui.textMuted,
  borderColor: colors.brand.yellowDark,
}

/**
 * Page de lobby Typuzzle.
 * Thin page : configure le thème et le texte explicatif, puis délègue à `LobbyPage`.
 */
export default function LobbyTypesPage() {
  return (
    <LobbyPage
      gameRoute="/types"
      theme={THEME}
      startMode="Types"
      explanationText={<span style={{ fontSize: '1.25rem' }}>Des résistances, faiblesses et immunités sont affichées. Devine le type ou la paire de types Pokémon qui correspond à ces interactions !</span>}
    />
  )
}
