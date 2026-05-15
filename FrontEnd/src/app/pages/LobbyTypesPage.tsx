import LobbyPage from '../components/LobbyPage'
import { colors } from '../design/colors'

const THEME = {
  primary: colors.brand.yellow,
  primaryLight: colors.brand.yellowLight,
  primaryDark: colors.brand.yellowWarm,
  textOnColor: colors.ui.textPrimary,
  borderColor: colors.brand.yellowDark,
}

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
