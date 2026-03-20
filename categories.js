/**
 * CATEGORIAS PADRÃO — Palavra na Testa
 * 
 * Edite as palavras aqui! Cada categoria tem:
 *   n: "NOME DA CATEGORIA"
 *   w: ["palavra1", "palavra2", ...]
 * 
 * NORMAIS = ativas por padrão no jogo
 * EXTRAS  = desativadas por padrão (o jogador pode ativar)
 */

const DEFAULT_CATS_NORMAL = [
    {
        n: "ANIMAIS",
        w: ["Gato", "Cachorro", "Elefante", "Girafa", "Leão", "Tubarão", "Panda", "Zebra", "Macaco", "Cavalo", "Águia", "Cobra", "Golfinho", "Urso", "Coelho"]
    },
    {
        n: "FILMES",
        w: ["Titanic", "Avatar", "Matrix", "Shrek", "Barbie", "Batman", "Frozen", "Vingadores", "Coringa", "Homem-Aranha", "Rei Leão", "Star Wars", "Harry Potter", "Jurassic Park", "Procurando Nemo"]
    },
    {
        n: "OBJETOS",
        w: ["Mesa", "Cadeira", "Celular", "Espelho", "Sofá", "Copo", "Relógio", "Sapato", "Computador", "Travesseiro", "Guarda-chuva", "Chave", "Óculos", "Mochila", "Panela"]
    },
    {
        n: "AÇÕES",
        w: ["Correr", "Dançar", "Nadar", "Dormir", "Comer", "Beijar", "Gritar", "Chorar", "Pular", "Cantar", "Dirigir", "Cozinhar", "Surfar", "Escalar", "Meditar"]
    },
    {
        n: "FAMOSOS",
        w: ["Neymar", "Anitta", "Messi", "Beyoncé", "Xuxa", "Pelé", "Madonna", "Silvio Santos", "Taylor Swift", "Ronaldinho", "Gal Gadot", "Will Smith", "Ivete Sangalo", "Elton John"]
    },
    {
        n: "LUGARES",
        w: ["Praia", "Escola", "Shopping", "Cinema", "Hospital", "Igreja", "Parque", "Banco", "Restaurante", "Estádio", "Aeroporto", "Museu", "Fazenda", "Biblioteca"]
    },
    {
        n: "ESPORTES",
        w: ["Futebol", "Basquete", "Vôlei", "Natação", "Tênis", "Surfe", "Skate", "Boxe", "Judô", "Ciclismo", "Corrida", "Ginástica", "Handebol", "Golfe"]
    },
    {
        n: "COMIDAS",
        w: ["Pizza", "Hambúrguer", "Sushi", "Lasanha", "Açaí", "Feijoada", "Brigadeiro", "Coxinha", "Churrasco", "Sorvete", "Pastel", "Tapioca", "Pão de Queijo", "Strogonoff"]
    },
    {
        n: "PROFISSÕES",
        w: ["Médico", "Professor", "Bombeiro", "Astronauta", "Policial", "Cozinheiro", "Dentista", "Piloto", "Veterinário", "Engenheiro", "Advogado", "Jornalista", "Eletricista", "Arquiteto"]
    },
    {
        n: "MARCAS",
        w: ["Nike", "Apple", "Coca-Cola", "Google", "Netflix", "Disney", "Samsung", "McDonald's", "Adidas", "Amazon", "YouTube", "Spotify", "PlayStation", "Havaianas"]
    }
];

const DEFAULT_CATS_EXTRA = [
    {
        n: "DANCINHAS DO TIKTOK",
        w: ["Raca Negra", "Dança da Mãozinha", "Tchuco Tchuco", "Dança do Pombo", "Hit do Verão", "Passinho do Romano", "Sarrada no Ar", "Dança da Motinha", "Vai no Chão", "Rebolation"]
    },
    {
        n: "FOBIAS",
        w: ["Aracnofobia", "Claustrofobia", "Acrofobia", "Tripofobia", "Coulrofobia", "Agorafobia", "Nictofobia", "Glossofobia", "Cinofobia", "Hemofobia"]
    },
    {
        n: "MEMES BRASILEIROS",
        w: ["Nazaré Confusa", "Faustão", "É o Tchan", "Que Isso Véi", "Eita Giovana", "Cala Boca Galvão", "Aí Você Me Quebra", "Tá Serto", "Chaves Pistola", "Stonks"]
    },
    {
        n: "PERSONAGENS DE DESENHO",
        w: ["Bob Esponja", "Mickey Mouse", "Pikachu", "Goku", "Naruto", "Pica-Pau", "Tom e Jerry", "Scooby-Doo", "Pernalonga", "Homem-Aranha", "Batman", "Super-Homem", "Sonic", "Mario"]
    },
    {
        n: "APPS E REDES SOCIAIS",
        w: ["WhatsApp", "Instagram", "TikTok", "YouTube", "Twitter", "Spotify", "Uber", "iFood", "Netflix", "Tinder", "Pinterest", "Snapchat", "Telegram", "Discord"]
    },
    {
        n: "EMOJIS (IMITE!)",
        w: ["😂 Chorando de rir", "😱 Chocado", "🤡 Palhaço", "💀 Caveira", "🥶 Congelado", "🤑 Dinheiro", "😴 Dormindo", "🤮 Vomitando", "🥳 Festejando", "😈 Diabinho", "🤯 Mente Explodindo", "🫣 Espiando"]
    }
];
