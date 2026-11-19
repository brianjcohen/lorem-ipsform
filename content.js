// Shamelessly Vibe-Coded Form Filler content script.
//
// The popup injects this file into the active tab on demand (see popup.js) and
// then calls methods on globalThis.__formFiller. Injecting it more than once is
// safe: the guard below keeps the first instance.

(() => {
if (globalThis.__formFiller) return;

// Input types that get generated text. Password, date, time, range, color,
// file and hidden inputs are left alone.
const TEXT_INPUT_TYPES = new Set(['text', 'email', 'tel', 'url', 'search', 'number']);

const MAX_PASSES = 3;

// form.elements, read past a control named "elements" that would shadow it
const FORM_ELEMENTS_GETTER = Object.getOwnPropertyDescriptor(HTMLFormElement.prototype, 'elements').get;

class RandomFormFiller {
  constructor() {
    // Sample data for random generation
    this.firstNames = [
      'John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Chris', 'Emma', 'Alex', 'Maria',
      'James', 'Jennifer', 'Robert', 'Linda', 'Michael', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan',
      'Joseph', 'Jessica', 'Thomas', 'Karen', 'Christopher', 'Nancy', 'Charles', 'Lisa', 'Daniel', 'Betty',
      'Matthew', 'Helen', 'Anthony', 'Sandra', 'Mark', 'Donna', 'Donald', 'Carol', 'Steven', 'Ruth',
      'Paul', 'Sharon', 'Andrew', 'Michelle', 'Joshua', 'Laura', 'Kenneth', 'Sarah', 'Kevin', 'Kimberly',
      'Brian', 'Deborah', 'George', 'Dorothy', 'Timothy', 'Amy', 'Ronald', 'Angela', 'Jason', 'Ashley',
      'Edward', 'Brenda', 'Jeffrey', 'Emma', 'Ryan', 'Olivia', 'Jacob', 'Cynthia', 'Gary', 'Marie',
      'Nicholas', 'Janet', 'Eric', 'Catherine', 'Jonathan', 'Frances', 'Stephen', 'Christine', 'Larry', 'Samantha',
      'Justin', 'Debra', 'Scott', 'Rachel', 'Brandon', 'Carolyn', 'Benjamin', 'Janet', 'Samuel', 'Virginia',
      'Gregory', 'Maria', 'Alexander', 'Heather', 'Patrick', 'Diane', 'Frank', 'Julie', 'Raymond', 'Joyce',
      // International names with Unicode characters
      'José', 'André', 'François', 'René', 'Léon', 'Céline', 'Zoë', 'Chloé', 'Noël', 'Anaïs',
      'Björn', 'Søren', 'Göran', 'Åsa', 'Ingrid', 'Astrid', 'Mikael', 'Åke', 'Ève', 'Élise',
      'Jörg', 'Günther', 'Jürgen', 'Ömer', 'Sönke', 'Bärbel', 'Käthe', 'Gülşen', 'Şükrü', 'Ödön',
      'Alejandro', 'Andrés', 'Jesús', 'Raúl', 'Víctor', 'Ángel', 'Adrián', 'Hernán', 'Rúben', 'Darío',
      'Sofía', 'María', 'Lucía', 'Natalia', 'Adriana', 'Verónica', 'Mónica', 'Begoña', 'Inés', 'Ximena',
      'João', 'André', 'José', 'António', 'Luís', 'Rúben', 'Vítor', 'Tomás', 'João', 'Gonçalo',
      'Ana', 'Catarina', 'Inês', 'Joana', 'Marta', 'Sara', 'Mariana', 'Patrícia', 'Bárbara', 'Cláudia',
      'Łukasz', 'Michał', 'Krzysztof', 'Tomasz', 'Paweł', 'Marcin', 'Piotr', 'Stanisław', 'Wojciech', 'Grzegorz',
      'Anna', 'Katarzyna', 'Małgorzata', 'Agnieszka', 'Barbara', 'Ewa', 'Elżbieta', 'Krystyna', 'Jolanta', 'Teresa',
      'Jiří', 'Pavel', 'Tomáš', 'Jan', 'Petr', 'Josef', 'Martin', 'Lukáš', 'David', 'Jakub'
    ];
    
    this.lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
      'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
      'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
      'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
      'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
      'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
      'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
      'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
      'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
      'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez',
      // International surnames with Unicode characters
      'García', 'Rodríguez', 'Martínez', 'Hernández', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Vargas',
      'Gutiérrez', 'Fernández', 'Vázquez', 'Mendoza', 'Morales', 'Jiménez', 'Romero', 'Medina', 'Aguilar', 'Herrera',
      'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann',
      'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann',
      'Dupont', 'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Durand', 'Leroy', 'Moreau',
      'Simon', 'Laurent', 'Lefèvre', 'Michel', 'García', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier',
      'Morel', 'Girard', 'André', 'Lefébvre', 'Mercier', 'Dupuis', 'Lambert', 'Bonnet', 'François', 'Martinez',
      'Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horáček', 'Němec',
      'Kowalski', 'Nowak', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Woźniak',
      'Dąbrowski', 'Kozłowski', 'Jankowski', 'Mazur', 'Kwiatkowski', 'Krawczyk', 'Piotrowski', 'Grabowski', 'Nowakowski', 'Pawłowski',
      'Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Sousa', 'Rodrigues', 'Fernandes', 'Gomes', 'Martins',
      'Costa', 'Ribeiro', 'Carvalho', 'Teixeira', 'Moreira', 'Correia', 'Mendes', 'Nunes', 'Soares', 'Vieira',
      'Andersen', 'Nielsen', 'Hansen', 'Pedersen', 'Sørensen', 'Rasmussen', 'Jørgensen', 'Petersen', 'Madsen', 'Kristensen'
    ];
    
    this.cities = [
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
      'Austin', 'Jacksonville', 'San Francisco', 'Indianapolis', 'Columbus', 'Fort Worth', 'Charlotte', 'Seattle', 'Denver', 'El Paso',
      'Detroit', 'Washington', 'Boston', 'Memphis', 'Nashville', 'Portland', 'Oklahoma City', 'Las Vegas', 'Louisville', 'Baltimore',
      'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Mesa', 'Kansas City', 'Atlanta', 'Long Beach', 'Colorado Springs',
      'Raleigh', 'Miami', 'Virginia Beach', 'Omaha', 'Oakland', 'Minneapolis', 'Tulsa', 'Arlington', 'Tampa', 'New Orleans',
      'Wichita', 'Cleveland', 'Bakersfield', 'Aurora', 'Anaheim', 'Honolulu', 'Santa Ana', 'Riverside', 'Corpus Christi', 'Lexington',
      'Stockton', 'Henderson', 'Saint Paul', 'St. Louis', 'Cincinnati', 'Pittsburgh', 'Greensboro', 'Anchorage', 'Plano', 'Lincoln',
      'Orlando', 'Irvine', 'Newark', 'Durham', 'Chula Vista', 'Toledo', 'Fort Wayne', 'St. Petersburg', 'Laredo', 'Jersey City',
      'Chandler', 'Madison', 'Lubbock', 'Scottsdale', 'Reno', 'Buffalo', 'Gilbert', 'Glendale', 'North Las Vegas', 'Winston-Salem',
      'Chesapeake', 'Norfolk', 'Fremont', 'Garland', 'Irving', 'Hialeah', 'Richmond', 'Boise', 'Spokane', 'Baton Rouge'
    ];
    
    this.companies = [
      'TechCorp', 'DataSoft', 'InnovateLabs', 'GlobalTech', 'FutureSys', 'NextGen', 'SmartSolutions', 'WebDynamic', 'CloudFirst', 'DigitalEdge',
      'CyberTech', 'MetaVerse Inc', 'QuantumLeap', 'SynergyPro', 'AlphaTech', 'BetaSystems', 'GammaCorp', 'DeltaSoft', 'EpsilonData', 'ZetaLogic',
      'EtaNetworks', 'ThetaDev', 'IotaCloud', 'KappaSync', 'LambdaCore', 'MuSoft', 'NuTech', 'XiSystems', 'OmicronLabs', 'PiData',
      'RhoTech', 'SigmaCorp', 'TauSoft', 'UpsilonNet', 'PhiSystems', 'ChiTech', 'PsiLogic', 'OmegaCorp', 'AlphaNet', 'BetaCloud',
      'NexusCore', 'VortexTech', 'MatrixSoft', 'HelixCorp', 'PulseTech', 'FlowSystems', 'StreamCorp', 'WaveTech', 'PeakSoft', 'ZenithCorp',
      'ApexTech', 'SummitSoft', 'CrestCorp', 'PinnacleTech', 'VertexSoft', 'EdgeCorp', 'BridgeTech', 'LinkSoft', 'NodeCorp', 'HubTech',
      'CoreSoft', 'BaseCorp', 'RootTech', 'FoundSoft', 'GroundCorp', 'SolidTech', 'RockSoft', 'StoneCorp', 'SteelTech', 'IronSoft',
      'TitanCorp', 'GiantTech', 'MegaSoft', 'UltraCorp', 'SuperTech', 'HyperSoft', 'TurboCorp', 'FastTech', 'SwiftSoft', 'QuickCorp',
      'RapidTech', 'SpeedSoft', 'FlashCorp', 'BoltTech', 'ThunderSoft', 'LightCorp', 'BrightTech', 'ShineSoft', 'GlowCorp', 'SparkTech',
      'FlameSoft', 'FireCorp', 'BurnTech', 'HeatSoft', 'WarmCorp', 'CoolTech', 'ChillSoft', 'FrostCorp', 'IceTech', 'SnowSoft'
    ];
    
    // Only domains reserved for testing (RFC 2606), so a test form that really
    // sends email can't reach anyone. Subdomains add variety.
    this.domains = [
      'example.com', 'example.net', 'example.org',
      'mail.example.com', 'test.example.com', 'corp.example.com', 'staff.example.com', 'dev.example.com',
      'users.example.net', 'inbox.example.net', 'office.example.net', 'team.example.net',
      'members.example.org', 'campus.example.org', 'clinic.example.org', 'volunteers.example.org'
    ];
    
    this.words = [
      'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua',
      'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in',
      'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
      'mollit', 'anim', 'id', 'est', 'laborum', 'at', 'vero', 'eos', 'accusamus', 'accusantium', 'doloremque', 'laudantium', 'totam', 'rem', 'aperiam', 'eaque', 'ipsa', 'quae', 'ab',
      'illo', 'inventore', 'veritatis', 'et', 'quasi', 'architecto', 'beatae', 'vitae', 'dicta', 'sunt', 'explicabo', 'nemo', 'ipsam', 'quia', 'voluptas', 'aspernatur', 'aut', 'odit', 'fugit',
      'consequuntur', 'magni', 'dolores', 'ratione', 'sequi', 'nesciunt', 'neque', 'porro', 'quisquam', 'dolorem', 'adipisci', 'numquam', 'eius', 'modi', 'tempora', 'incidunt', 'magnam', 'quam', 'quaerat',
      'voluptatem', 'fuga', 'harum', 'quidem', 'rerum', 'facilis', 'expedita', 'distinctio', 'nam', 'libero', 'tempore', 'cum', 'soluta', 'nobis', 'eligendi', 'optio', 'cumque', 'nihil', 'impedit',
      'quo', 'minus', 'maxime', 'placeat', 'facere', 'possimus', 'omnis', 'assumenda', 'repellendus', 'temporibus', 'autem', 'quibusdam', 'officiis', 'debitis', 'necessitatibus', 'saepe', 'eveniet', 'voluptates', 'repudiandae',
      'recusandae', 'itaque', 'earum', 'hic', 'tenetur', 'sapiente', 'delectus', 'reiciendis', 'voluptatibus', 'maiores', 'alias', 'perferendis', 'doloribus', 'asperiores', 'repellat', 'hanc', 'derunt', 'corrupti', 'quos',
      'blanditiis', 'praesentium', 'accusantium', 'deleniti', 'atque', 'corrupted', 'excepturi', 'obcaecati', 'mollitia', 'provident', 'similique', 'sunt', 'optio', 'reprehenderit', 'maiores', 'alias', 'consequatur', 'perferendis', 'doloribus',
      // Numbers and years
      '2024', '2023', '2025', '100', '250', '500', '1000', '50', '75', '25', '10', '5', '1', '2', '3', '15', '20', '30', '40', '60', '80', '90', '150', '200', '300', '400', '600', '700', '800', '900',
      // Common words for more natural sentences
      'the', 'and', 'or', 'but', 'so', 'for', 'nor', 'yet', 'a', 'an', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'some', 'many', 'few', 'all', 'most', 'every', 'each',
      'very', 'quite', 'rather', 'pretty', 'too', 'much', 'more', 'less', 'most', 'least', 'best', 'worst', 'better', 'worse', 'good', 'bad', 'great', 'small', 'large', 'big', 'little', 'old', 'new', 'young',
      'system', 'process', 'method', 'approach', 'solution', 'problem', 'issue', 'question', 'answer', 'result', 'outcome', 'impact', 'effect', 'cause', 'reason', 'purpose', 'goal', 'objective', 'target',
      'business', 'company', 'organization', 'team', 'group', 'department', 'project', 'task', 'work', 'job', 'role', 'responsibility', 'duty', 'function', 'service', 'product', 'feature', 'benefit', 'advantage'
    ];
    
    // Punctuation and conjunctions for sentence formation
    this.conjunctions = ['and', 'but', 'or', 'so', 'yet', 'for', 'nor', 'because', 'since', 'although', 'while', 'however', 'therefore', 'moreover', 'furthermore', 'nevertheless'];
    this.punctuation = [',', ';', '—', ' & '];
    this.sentenceEnders = ['.', '.', '.', '!', '?']; // Weighted toward periods
  }

  pick(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ---------------------------------------------------------------------------
  // Text generation
  // ---------------------------------------------------------------------------

  // Random words, for single-line inputs
  generateRandomText(minLength = 5, maxLength = 20) {
    const length = this.randomInt(minLength, maxLength);
    const words = [];
    for (let i = 0; i < length; i++) words.push(this.pick(this.words));
    return words.join(' ');
  }

  // Sentence-like text, for textareas
  generateRealisticSentences(minSentences = 2, maxSentences = 4) {
    const count = this.randomInt(minSentences, maxSentences);
    const sentences = [];
    for (let i = 0; i < count; i++) sentences.push(this.generateSingleSentence());
    return sentences.join(' ');
  }

  generateSingleSentence() {
    const numWords = this.randomInt(4, 15);
    const words = [];

    for (let i = 0; i < numWords; i++) {
      let word = this.pick(this.words);

      if (i === 0) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }

      // Possessives, now and then
      if (Math.random() < 0.1 && word.length > 3) {
        word += word.endsWith('s') ? "'" : "'s";
      }

      // Plurals, now and then
      if (Math.random() < 0.15 && word.length > 3 && !word.includes("'") && !this.isNumber(word)) {
        if (/(s|sh|ch|x|z)$/.test(word)) {
          word += 'es';
        } else if (word.endsWith('y') && !'aeiou'.includes(word[word.length - 2])) {
          word = word.slice(0, -1) + 'ies';
        } else {
          word += 's';
        }
      }

      words.push(word);

      // Punctuation mid-sentence, sometimes followed by a conjunction
      if (i > 2 && i < numWords - 2 && Math.random() < 0.2) {
        const punct = this.pick(this.punctuation);
        words[words.length - 1] += punct;
        if (Math.random() < 0.6 && punct !== ' & ') {
          words.push(this.pick(this.conjunctions));
          i++;
        }
      }
    }

    words[words.length - 1] += this.pick(this.sentenceEnders);
    return words.join(' ');
  }

  isNumber(str) {
    return !isNaN(str) && !isNaN(parseFloat(str));
  }

  getNames(suppressUnicode) {
    if (!suppressUnicode) return { firstNames: this.firstNames, lastNames: this.lastNames };
    const ascii = (s) => !/[^\x00-\x7F]/.test(s);
    return {
      firstNames: this.firstNames.filter(ascii),
      lastNames: this.lastNames.filter(ascii)
    };
  }

  // Strip accents and anything that isn't a letter or digit, for emails and usernames
  slug(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]/g, '').toLowerCase();
  }

  generateRandomName(suppressUnicode) {
    const names = this.getNames(suppressUnicode);
    return `${this.pick(names.firstNames)} ${this.pick(names.lastNames)}`;
  }

  generateRandomEmail(suppressUnicode) {
    const names = this.getNames(suppressUnicode);
    const first = this.slug(this.pick(names.firstNames));
    const last = this.slug(this.pick(names.lastNames));
    return `${first}.${last}${this.randomInt(0, 998)}@${this.pick(this.domains)}`;
  }

  generateRandomUsername() {
    const names = this.getNames(true);
    return `${this.slug(this.pick(names.firstNames))}${this.slug(this.pick(names.lastNames))}${this.randomInt(1, 99)}`;
  }

  generateRandomUrl() {
    return `https://${this.slug(this.pick(this.companies))}.example.com/${this.pick(['', 'about', 'home', 'blog'])}`;
  }

  generateRandomPhone() {
    return `(${this.randomInt(100, 999)}) ${this.randomInt(100, 999)}-${this.randomInt(1000, 9999)}`;
  }

  // A number that fits the input's min, max and step attributes
  generateNumberFor(el, fallbackMin = 1, fallbackMax = 100) {
    const min = el.min !== '' && !isNaN(el.min) ? Number(el.min) : null;
    const max = el.max !== '' && !isNaN(el.max) ? Number(el.max) : null;
    const lo = min ?? (max !== null ? Math.min(fallbackMin, max) : fallbackMin);
    const hi = max ?? Math.max(lo, fallbackMax);
    const step = el.step && el.step !== 'any' && Number(el.step) > 0 ? Number(el.step) : 1;
    const steps = Math.floor((hi - lo) / step);
    const value = lo + this.randomInt(0, Math.max(0, steps)) * step;
    return String(Number(value.toFixed(10)));
  }

  // How many sentences a textarea should get, from its purpose and size
  textareaSentenceRange(textarea, hint) {
    let min = 2;
    let max = 6;

    if (/comment|description|message|note|feedback|review|bio|about|summary|mission/.test(hint)) {
      min = 4;
      max = 10;
    }

    let rows = textarea.rows > 0 ? textarea.rows : 3;
    let cols = textarea.cols > 0 ? textarea.cols : 50;

    // Without explicit rows/cols, estimate them from the rendered size
    if (!textarea.hasAttribute('rows') || !textarea.hasAttribute('cols')) {
      const style = window.getComputedStyle(textarea);
      const height = parseFloat(style.height);
      const width = parseFloat(style.width);
      const lineHeight = parseFloat(style.lineHeight) || 20;
      const fontSize = parseFloat(style.fontSize) || 14;
      if (!textarea.hasAttribute('rows') && height > 0) rows = Math.max(1, Math.floor(height / lineHeight));
      if (!textarea.hasAttribute('cols') && width > 0) cols = Math.max(1, Math.floor(width / (fontSize * 0.6)));
    }

    const area = rows * cols;

    if (area <= 150) {
      min = Math.max(1, Math.floor(min * 0.5));
      max = Math.max(1, Math.floor(max * 0.6));
    } else if (area <= 400) {
      min = Math.max(1, Math.floor(min * 0.8));
      max = Math.max(2, Math.floor(max * 0.8));
    } else if (area > 1000) {
      const scale = area <= 2000 ? Math.max(2, area / 400) : Math.max(3, area / 300);
      min = Math.ceil(min * scale);
      max = Math.ceil(max * scale);
    }

    const cap = area > 1000 ? Math.min(25, Math.floor(area / 60)) : 8;
    max = Math.min(cap, Math.max(min, max));
    min = Math.min(min, max);
    return { min, max };
  }

  // ---------------------------------------------------------------------------
  // Field detection
  // ---------------------------------------------------------------------------

  // What kind of control this is: 'text', 'dropdown', 'radio', 'checkbox' or null
  kindOf(el) {
    if (el instanceof HTMLTextAreaElement) return 'text';
    if (el instanceof HTMLSelectElement) return 'dropdown';
    if (el instanceof HTMLInputElement) {
      // el.type is normalized: a missing or unknown type attribute reads as 'text'
      if (el.type === 'radio') return 'radio';
      if (el.type === 'checkbox') return 'checkbox';
      if (TEXT_INPUT_TYPES.has(el.type)) return 'text';
    }
    return null;
  }

  // Lower-case text describing a field: its attributes and its label text.
  // camelCase and snake_case are split so "firstName" reads as "first name".
  hintFor(el) {
    const parts = [
      el.getAttribute('name'),
      el.getAttribute('id'),
      el.getAttribute('placeholder'),
      el.getAttribute('autocomplete'),
      el.getAttribute('aria-label')
    ];
    if (el.labels) {
      for (const label of el.labels) parts.push(label.textContent);
    }
    return parts
      .filter(Boolean)
      .join(' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  generateContentFor(el, suppressUnicode) {
    const hint = this.hintFor(el);
    const words = new Set(hint.split(' '));
    const has = (...w) => w.some((x) => words.has(x));
    const autocomplete = (el.getAttribute('autocomplete') || '').toLowerCase();

    if (el instanceof HTMLTextAreaElement) {
      const range = this.textareaSentenceRange(el, hint);
      return this.generateRealisticSentences(range.min, range.max);
    }

    const type = el.type;
    const names = this.getNames(suppressUnicode);

    if (type === 'email' || /e ?mail/.test(hint)) return this.generateRandomEmail(suppressUnicode);
    if (type === 'tel' || has('phone', 'mobile', 'cell', 'tel', 'telephone')) return this.generateRandomPhone();
    if (type === 'url' || has('url', 'website', 'homepage')) return this.generateRandomUrl();
    if (type === 'number' || has('age', 'year', 'quantity', 'qty', 'count')) return this.generateNumberFor(el);
    if (autocomplete === 'username' || /user ?name|login|handle/.test(hint)) return this.generateRandomUsername();
    if (autocomplete === 'given-name' || has('fname', 'firstname', 'given') || /first name/.test(hint)) return this.pick(names.firstNames);
    if (autocomplete === 'family-name' || has('lname', 'lastname', 'surname', 'family') || /last name/.test(hint)) return this.pick(names.lastNames);
    if (has('company', 'organization', 'organisation', 'employer', 'business', 'org')) return this.pick(this.companies);
    if (has('name')) return this.generateRandomName(suppressUnicode);
    if (has('city', 'town')) return this.pick(this.cities);
    return this.generateRandomText();
  }

  // ---------------------------------------------------------------------------
  // Scopes: one form, the controls outside any form, or the whole page
  // ---------------------------------------------------------------------------

  // scope: a form index (number), 'loose' (controls with no form), or 'all'
  controlsIn(scope) {
    const all = Array.from(document.querySelectorAll('input, select, textarea, button'));
    if (scope === 'all') return all;
    if (scope === 'loose') return all.filter((el) => el.form === null);
    const form = document.forms[scope];
    // form.elements also includes controls attached with the form="..." attribute
    return form ? Array.from(FORM_ELEMENTS_GETTER.call(form)) : null;
  }

  isEditable(el) {
    return !el.matches(':disabled') && !(el.readOnly && this.kindOf(el) === 'text');
  }

  isSubmitRelated(el) {
    return /submit/.test(`${el.name} ${el.id} ${el.value}`.toLowerCase());
  }

  isSubmitButton(el) {
    return (el instanceof HTMLButtonElement && el.type === 'submit') ||
           (el instanceof HTMLInputElement && (el.type === 'submit' || el.type === 'image'));
  }

  // ---------------------------------------------------------------------------
  // Form detection
  // ---------------------------------------------------------------------------

  countKinds(controls) {
    const counts = { textInputs: 0, dropdowns: 0, radioButtons: 0, checkboxes: 0 };
    for (const el of controls) {
      const kind = this.kindOf(el);
      if (kind === 'text') counts.textInputs++;
      else if (kind === 'dropdown') counts.dropdowns++;
      else if (kind === 'radio') counts.radioButtons++;
      else if (kind === 'checkbox') counts.checkboxes++;
    }
    counts.totalElements = counts.textInputs + counts.dropdowns + counts.radioButtons + counts.checkboxes;
    return counts;
  }

  // A readable name for a form. Uses getAttribute because form.name and
  // form.id return a child control when one is named "name" or "id".
  describeForm(form, index) {
    const heading = form.querySelector('h1, h2, h3, h4, h5, h6, legend');
    const submit = Array.from(form.querySelectorAll('button, input')).find((el) => this.isSubmitButton(el));
    const name = [
      form.getAttribute('name'),
      form.getAttribute('id'),
      form.getAttribute('aria-label'),
      heading && heading.textContent,
      submit && (submit.textContent || submit.value)
    ].map((s) => String(s || '').replace(/\s+/g, ' ').trim()).find(Boolean) || `Form ${index + 1}`;
    return name.length > 50 ? name.slice(0, 50) + '\u2026' : name;
  }

  // Forms with something to fill, plus a "Loose Form Elements" entry for
  // controls outside any form. `scope` is what to pass back to fill().
  detectForms() {
    const results = [];
    Array.from(document.forms).forEach((form, index) => {
      const counts = this.countKinds(this.controlsIn(index));
      if (counts.totalElements > 0) {
        results.push({ scope: index, name: this.describeForm(form, index), ...counts });
      }
    });

    const loose = this.countKinds(this.controlsIn('loose'));
    if (loose.totalElements > 0) {
      results.push({ scope: 'loose', name: 'Loose Form Elements', ...loose });
    }
    return results;
  }

  // ---------------------------------------------------------------------------
  // Filling
  // ---------------------------------------------------------------------------

  // Fire the events frameworks listen for, so the page notices the new value
  triggerEvents(el) {
    el.focus({ preventScroll: true });
    for (const type of ['input', 'change', 'keydown', 'keyup', 'click']) {
      el.dispatchEvent(new Event(type, { bubbles: true, cancelable: true, composed: true }));
    }
    el.blur();
  }

  setText(el, value) {
    // Setting .value skips the maxlength check that typing would get
    if (el.maxLength > 0 && value.length > el.maxLength) value = value.slice(0, el.maxLength).trimEnd();
    el.value = value;
    this.triggerEvents(el);
  }

  // One pass over the scope. Controls filled in an earlier pass of the same
  // run are skipped, so later passes only pick up fields the page has added.
  fillPass(scope, options, done, results) {
    const controls = this.controlsIn(scope);
    if (!controls) return 0;

    const { onlyEmptyFields, suppressUnicode } = options;
    let filled = 0;
    const radioGroups = new Map();

    for (const el of controls) {
      if (done.has(el) || !this.isEditable(el)) continue;
      const kind = this.kindOf(el);

      if (kind === 'text' && options.fillTexts) {
        if (onlyEmptyFields && el.value.trim() !== '') continue;
        this.setText(el, this.generateContentFor(el, suppressUnicode));
        done.add(el);
        results.textInputs++;
        filled++;
      } else if (kind === 'dropdown' && options.fillDropdowns) {
        if (onlyEmptyFields && el.value.trim() !== '') continue;
        const choices = Array.from(el.options).filter((o) => !o.disabled && o.value.trim() !== '');
        if (choices.length === 0) continue;
        el.value = this.pick(choices).value;
        this.triggerEvents(el);
        done.add(el);
        results.dropdowns++;
        filled++;
      } else if (kind === 'radio' && options.fillRadios) {
        if (this.isSubmitRelated(el)) continue;
        // Radios without a name aren't grouped by the browser, so each stands alone
        // (the browser groups radios by form owner plus name)
        const key = el.name ? `${Array.prototype.indexOf.call(document.forms, el.form)}:${el.name}` : el;
        if (!radioGroups.has(key)) radioGroups.set(key, []);
        radioGroups.get(key).push(el);
      } else if (kind === 'checkbox' && options.fillCheckboxes) {
        if (this.isSubmitRelated(el)) continue;
        if (onlyEmptyFields && el.checked) continue;
        el.checked = Math.random() < 0.5;
        this.triggerEvents(el);
        done.add(el);
        results.checkboxes++;
        filled++;
      }
    }

    for (const members of radioGroups.values()) {
      if (onlyEmptyFields && members.some((r) => r.checked)) {
        members.forEach((r) => done.add(r));
        continue;
      }
      const choice = this.pick(members);
      choice.checked = true; // the browser unchecks the rest of the group
      this.triggerEvents(choice);
      members.forEach((r) => done.add(r));
      results.radioButtons++;
      filled++;
    }

    return filled;
  }

  // Resolve once the DOM has been quiet for `quietMs`, or after `timeoutMs`
  waitForQuietDOM(quietMs = 200, timeoutMs = 1000) {
    return new Promise((resolve) => {
      let quietTimer;
      const finish = () => {
        observer.disconnect();
        clearTimeout(quietTimer);
        clearTimeout(hardTimer);
        resolve();
      };
      const observer = new MutationObserver(() => {
        clearTimeout(quietTimer);
        quietTimer = setTimeout(finish, quietMs);
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'hidden', 'disabled']
      });
      quietTimer = setTimeout(finish, quietMs);
      const hardTimer = setTimeout(finish, timeoutMs);
    });
  }

  // Fill a scope (see controlsIn) and resolve with counts once every pass is
  // done. Filling one field can make the page add more (a "business" choice
  // revealing company fields), so it runs up to MAX_PASSES passes.
  // Never submits a form or clicks a button.
  async fill(scope = 'all', options = {}) {
    options = {
      fillTexts: true,
      fillDropdowns: true,
      fillRadios: true,
      fillCheckboxes: true,
      onlyEmptyFields: true,
      suppressUnicode: false,
      ...options
    };

    if (!this.controlsIn(scope)) return { error: 'That form is no longer on the page. Try again.' };

    // Submit buttons stay disabled while filling, so stray events can't submit
    const submitButtons = this.controlsIn(scope).filter((el) => this.isSubmitButton(el));
    const wasDisabled = submitButtons.map((b) => b.disabled);
    submitButtons.forEach((b) => { b.disabled = true; });

    const results = { textInputs: 0, dropdowns: 0, radioButtons: 0, checkboxes: 0 };
    const done = new WeakSet();

    try {
      for (let pass = 1; pass <= MAX_PASSES; pass++) {
        const filled = this.fillPass(scope, options, done, results);
        if (filled === 0 || pass === MAX_PASSES) break;
        await this.waitForQuietDOM();
      }
    } finally {
      submitButtons.forEach((b, i) => { b.disabled = wasDisabled[i]; });
    }

    return results;
  }

  // ---------------------------------------------------------------------------
  // Highlighting (used while hovering over the popup's form list)
  // ---------------------------------------------------------------------------

  addHighlightBox(target, padding, color) {
    const rect = target.getBoundingClientRect();
    const box = document.createElement('div');
    box.className = 'form-filler-highlight';
    box.style.cssText = `
      position: absolute;
      top: ${rect.top + window.scrollY - padding}px;
      left: ${rect.left + window.scrollX - padding}px;
      width: ${rect.width + padding * 2}px;
      height: ${rect.height + padding * 2}px;
      border: ${padding > 2 ? 3 : 2}px solid ${color};
      background: ${color}1a;
      border-radius: ${padding > 2 ? 8 : 4}px;
      pointer-events: none;
      z-index: 2147483647;
    `;
    document.documentElement.appendChild(box);
  }

  highlight(scope) {
    this.removeHighlight();
    if (scope === 'loose') {
      for (const el of this.controlsIn('loose')) {
        if (this.kindOf(el)) this.addHighlightBox(el, 2, '#e74c3c');
      }
      return;
    }
    const form = document.forms[scope];
    if (!form) return;
    this.addHighlightBox(form, 5, '#3498db');
    const rect = form.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  removeHighlight() {
    document.querySelectorAll('.form-filler-highlight').forEach((el) => el.remove());
  }
}

globalThis.__formFiller = new RandomFormFiller();
})();
