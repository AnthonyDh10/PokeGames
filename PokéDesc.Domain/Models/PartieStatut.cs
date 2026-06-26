namespace PokéDesc.Domain;

public enum PartieStatut
{
    EnAttente,
    EnCours,
    Termine
}

public static class PartieStatutExtensions
{
    /// <summary>Retourne la valeur lisible envoyée au frontend (préserve l'accent de "Terminé").</summary>
    public static string ToDisplayString(this PartieStatut statut) => statut switch
    {
        PartieStatut.EnAttente => "EnAttente",
        PartieStatut.EnCours   => "EnCours",
        PartieStatut.Termine   => "Terminé",
        _                      => statut.ToString()
    };
}
