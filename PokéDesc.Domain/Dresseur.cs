namespace PokéDesc.Domain;

public class Dresseur
{
    public string Id { get; set; } = null!;
    public string Pseudo { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string MotDePasseHash { get; set; } = string.Empty;
    public List<string> AmisIds { get; set; } = new List<string>();
}
