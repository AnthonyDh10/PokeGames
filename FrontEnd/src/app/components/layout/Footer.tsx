export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="gap-8 mb-8">
          <div>
            <h3 className="text-white font-semibold mb-3">Contact</h3>
              Développeur fullstack - Anthony DINH : <a href="mailto:antho.dh@icloud.com" className="hover:text-white transition">antho.dh@icloud.com</a>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-700 pt-4 text-center text-sm text-gray-500">
          <p>Pokémon and Pokémon character names are trademarks of Nintendo. Pokémon character designs are © 1995-2026 The Pokémon Company. <br />
            This website is not affiliated with The Pokémon Company, Nintendo, Game Freak Inc., or Creatures Inc. <br />
            Data sourced from PokéAPI.
          </p>
        </div>
      </div>
    </footer>
  );
}
