import LobbyPage from '../components/LobbyPage'
import { colors } from '../design/colors'

const THEME = {
  primary: colors.brand.yellow,
  primaryLight: colors.brand.yellowLight,
  primaryDark: colors.brand.yellowWarm,
  textOnColor: colors.ui.textPrimary,
  background: {
    colorLeft: colors.ui.bgLeftGame,
    colorStripe: colors.brand.yellowWarm,
    colorRight: colors.brand.yellow,
  },
}

export default function LobbyTypesPage() {
  return (
    <LobbyPage
      gameRoute="/types"
      theme={THEME}
      startMode="Types"
      explanationText="Des résistances, faiblesses et immunités sont affichées. Devine le type ou la paire de types Pokémon qui correspond à ces interactions !"
    />
  )
}
