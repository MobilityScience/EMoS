/**
 * =============================================================================
 * European Mobility Society (EMoS) — Core Dataset
 * -----------------------------------------------------------------------------
 * Single source of truth shared across all static site pages:
 *   - INSTITUTIONS: 14 partner research institutions (coordinates, short tags, logos)
 *   - MEMBERS:      23 affiliated researchers (photos, ORCID-verified bios, aliases)
 *   - TOPIC_STYLES: Color tokens for the 6 Mobility Science topic filters
 *   - EXTRA_CONNECTIONS: Optional manual collaborations merged onto the D3 map
 *
 * Maintenance note for maintainers (Mattia / Luca / Riccardo):
 *   To add a member or institution, add their logo/photo under assets/logos/ or
 *   assets/photos/ and append an entry below; the map, directory, and filters
 *   update automatically across every page.
 *
 * Copyright (c) 2026 European Mobility Society (EMoS)
 * Project: https://mobilityscience.github.io/EMoS/
 * =============================================================================
 */
window.EMOS_DATA = {
  SOCIETY_NAME: 'European Mobility Society',

  // While true, members without a custom bio get a clearly flagged placeholder bio.
  // All 23 member bios are now populated from verified academic profiles.
  USE_SAMPLE_CONTENT: false,

  PUBLICATIONS_URL: 'publications.json',
  SYMPOSIA_URL: 'symposia.json',
  COUNTRIES_URL: 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json',
  CURVE_STRENGTH: 0.2,

  // Optional non-paper collaborations between institutions:
  // { from: 'exeter', to: 'isi', works: [{ title: '…', type: 'Workshop', year: 2025, url: '…' }] }
  EXTRA_CONNECTIONS: [],

  // Institutions shown on the European map and directory. Coordinates are city-level.
  INSTITUTIONS: [
    { id: 'ucl',       name: 'University College London',                         short: 'UCL',   city: 'London',    country: 'United Kingdom', lat: 51.5246, lng: -0.1340, logo: 'assets/logos/ucl.webp' },
    { id: 'nul',       name: 'Northeastern University London',                    short: 'NUL',   city: 'London',    country: 'United Kingdom', lat: 51.5080, lng: -0.0730, logo: 'assets/logos/nul.png' },
    { id: 'exeter',    name: 'University of Exeter',                              short: 'EXE',   city: 'Exeter',    country: 'United Kingdom', lat: 50.7365, lng: -3.5344, logo: 'assets/logos/exeter.png' },
    { id: 'liverpool', name: 'University of Liverpool',                           short: 'LIV',   city: 'Liverpool', country: 'United Kingdom', lat: 53.4058, lng: -2.9653, logo: 'assets/logos/liverpool.png' },
    { id: 'edinburgh', name: 'University of Edinburgh',                           short: 'EDI',   city: 'Edinburgh', country: 'United Kingdom', lat: 55.9445, lng: -3.1892, logo: 'assets/logos/edinburgh.webp' },
    { id: 'isi',       name: 'ISI Foundation',                                    short: 'ISI',   city: 'Turin',     country: 'Italy',          lat: 45.0628, lng: 7.6600,  logo: 'assets/logos/isi.png' },
    { id: 'fbk',       name: 'Fondazione Bruno Kessler',                          short: 'FBK',   city: 'Trento',    country: 'Italy',          lat: 46.0679, lng: 11.1502, logo: 'assets/logos/fbk.png' },
    { id: 'isti',      name: 'ISTI-CNR',                                          short: 'CNR',   city: 'Pisa',      country: 'Italy',          lat: 43.7193, lng: 10.4235, logo: 'assets/logos/isti.png' },
    { id: 'sony',      name: 'Sony CSL',                                          short: 'SONY',  city: 'Rome',      country: 'Italy',          lat: 41.9028, lng: 12.4964, logo: 'assets/logos/sony.jpg' },
    { id: 'ceu',       name: 'Central European University',                       short: 'CEU',   city: 'Vienna',    country: 'Austria',        lat: 48.2082, lng: 16.3738, logo: 'assets/logos/ceu.svg' },
    { id: 'corvinus',  name: 'Corvinus University of Budapest',                   short: 'CUB',   city: 'Budapest',  country: 'Hungary',        lat: 47.4862, lng: 19.0590, logo: 'assets/logos/corvinus.jpg' },
    { id: 'construct', name: 'Constructor University',                            short: 'CON',   city: 'Bremen',    country: 'Germany',        lat: 53.1675, lng: 8.6516,  logo: 'assets/logos/construct.jpg' },
    { id: 'ifisc',     name: 'IFISC (CSIC-UIB)',                                  short: 'IFISC', city: 'Palma',     country: 'Spain',          lat: 39.6372, lng: 2.6450,  logo: 'assets/logos/ifisc.png' },
    { id: 'upwr',      name: 'Wrocław University of Environmental and Life Sciences', short: 'UPWR', city: 'Wrocław',  country: 'Poland',         lat: 51.107,  lng: 17.038,  logo: 'assets/logos/upwr.png' }
  ],

  // Society members. `aliases` helps match papers across author name variants.
  MEMBERS: [
    {
      name: 'Elsa Arcaute',
      institutions: ['ucl'],
      photo: 'assets/photos/elsa.jpg',
      bio: 'Professor of Complexity Science at the Centre for Advanced Spatial Analysis (CASA), University College London (UCL). She holds a Part III MASt in Mathematics and a PhD in Theoretical Physics from the University of Cambridge, transitioning to complexity science in 2006 at Imperial College London. Her research models cities as self-organising complex systems, focusing on urban scaling laws, functional city boundaries, percolation theory, and multiscalar spatial inequality.'
    },
    {
      name: 'Hugo Barbosa',
      institutions: ['exeter'],
      photo: 'assets/photos/Hugo.jpeg',
      bio: 'Senior Lecturer in Computer Science at the University of Exeter and member of the BioComplex Laboratory. Previously a Postdoctoral Associate in Physics and Astronomy at the University of Rochester, his work sits at the intersection of network science, complex systems, and human dynamics. His research focuses on quantitative human mobility modeling, large-scale geolocated data, urban predictability regimes, and socioeconomic inequalities in travel diversity.'
    },
    {
      name: 'Ciro Beneduce',
      institutions: ['fbk'],
      photo: 'assets/photos/ciro.jpg',
      bio: 'PhD researcher affiliated with Fondazione Bruno Kessler (FBK) and the University of Trento in Italy. Working within computational social science and mobile computing, he investigates quantitative patterns in human movement across urban environments. His research focuses on human mobility modeling, large language and foundation models for zero-shot next-location and crowd-flow prediction, urban safety perception, and demographic biases.'
    },
    {
      name: 'Federico Botta',
      institutions: ['exeter'],
      photo: 'assets/photos/federico.jpeg',
      bio: 'Senior Lecturer in Data Science in the Department of Computer Science at the University of Exeter and Fellow at The Alan Turing Institute. He holds a BSc and MSc in Theoretical Physics from the University of Milano-Bicocca and an MSc and PhD in Complexity Science from the University of Warwick. His research combines novel digital data streams, mobile network records, and complex network theory to study collective human behaviour and urban mobility.'
    },
    {
      name: 'Matteo Bruno',
      institutions: ['sony'],
      photo: 'assets/photos/matteo.jpg',
      bio: 'Associate Researcher at Sony Computer Science Laboratories (Sony CSL) – Rome, working in close collaboration with the Enrico Fermi Research Center (CREF). Trained as a mathematician, he earned his PhD in Network Science from the IMT School for Advanced Studies Lucca in 2021. His research applies complex networks and geospatial data science to sustainable cities, quantitative frameworks for the 15-minute city, urban accessibility, and socio-spatial equity.'
    },
    {
      name: 'Carmen Cabrera',
      institutions: ['liverpool'],
      photo: 'assets/photos/Carmen.jpg',
      aliases: ['Carmen Cabrera-Arnau'],
      bio: 'Lecturer in Geographic Data Science in the Department of Geography and Planning at the University of Liverpool, member of the Geographic Data Science Lab, and honorary lecturer at UCL CASA. She serves on the Complex Systems Society Council and the UN Committee of Experts on Big Data and Data Science. Her research examines human mobility, urban disruptions, and algorithmic bias measurement and mitigation in digital trace datasets.'
    },
    {
      name: 'Alessia Calafiore',
      institutions: ['edinburgh'],
      photo: 'assets/photos/Alessia.jpg',
      bio: 'Lecturer in Sustainability and Urban Data Science at the Edinburgh School of Architecture and Landscape Architecture (ESALA) and Edinburgh Futures Institute, University of Edinburgh. She earned a joint PhD in Computer Science (Geoinformatics) from the University of Torino and the University of Luxembourg, and previously worked at Liverpool\'s Geographic Data Science Lab. Her research bridges urban planning and geoinformatics on mobility, spatial accessibility, and sustainable cities.'
    },
    {
      name: 'Antonio Desiderio',
      institutions: ['isi'],
      photo: 'assets/photos/antonio.jpg',
      bio: 'Postdoctoral Researcher at the ISI Foundation in Turin, Italy. He completed his PhD on complex systems dynamics in social and physical systems at the University of Rome "Tor Vergata" and collaborates internationally with groups including ANETI Lab. His research analyzes large-scale digital and physical traces to study urban mobility networks, socio-economic segregation, epidemic metapopulation modeling, and collective online behaviour.'
    },
    {
      name: 'Riccardo Di Clemente',
      institutions: ['nul', 'isi'],
      photo: 'assets/photos/riccardo.jpeg',
      bio: 'Associate Professor at the Network Science Institute, Northeastern University London, and Affiliated Researcher at the ISI Foundation in Turin. He holds a PhD in Economics from IMT Lucca and previously held appointments at MIT, UCL CASA as a Newton International Fellow, and the University of Exeter. His research bridges computational social science and network theory, analyzing digital footprints to study human mobility, urban resilience, and socio-economic segregation.'
    },
    {
      name: 'Riccardo Gallotti',
      institutions: ['fbk'],
      photo: 'assets/photos/gallotti.jpg',
      bio: 'Head of the Complex Human Behaviour (CHuB) Lab within the Digital Society Center at Fondazione Bruno Kessler (FBK) in Trento. He earned his PhD in Physics from the University of Bologna and held postdoctoral positions at IFISC and CEA Saclay before leading Horizon Europe disinformation initiatives at FBK. His research applies statistical physics and network science to spatial networks, public transit, human mobility, and digital society dynamics.'
    },
    {
      name: 'Márton Karsai',
      institutions: ['ceu'],
      photo: 'assets/photos/Marton.jpeg',
      bio: 'Full Professor and Head of the Department of Network and Data Science at Central European University (CEU) in Vienna, and Research Professor at the HUN-REN Alfréd Rényi Institute of Mathematics. He holds a PhD from the University of Szeged and Université Joseph Fourier, an HDR from ENS Lyon, and a DSc from the Hungarian Academy of Sciences. His research examines temporal networks, human mobility, socioeconomic segregation, and crisis-driven dynamics.'
    },
    {
      name: 'Balázs Lengyel',
      institutions: ['corvinus'],
      photo: 'assets/photos/Balazs.jpg',
      bio: 'Senior Research Fellow at the HUN-REN Centre for Economic and Regional Studies and faculty member at Corvinus University of Budapest, where he heads the Agglomeration and Social Networks (ANET) Lab. He earned his PhD in Economics from the Budapest University of Technology and Economics and was a visiting researcher at the MIT Human Mobility and Networks Lab. His work combines economic geography and network science on labour mobility, knowledge spillovers, and urban mixing.'
    },
    {
      name: 'Vittorio Loreto',
      institutions: ['sony'],
      photo: 'assets/photos/vittorio.jpg',
      bio: 'Full Professor of Physics of Complex Systems at Sapienza University of Rome, Research Leader at the Enrico Fermi Research Center (CREF), External Faculty at the Complexity Science Hub Vienna, and Director of Sony Computer Science Laboratories – Rome. After directing Sony CSL Paris, he founded Sony CSL Rome to bridge fundamental complexity science and societal transitions. His research explores the statistical physics of innovation, collective dynamics, sustainable cities, and urban mobility.'
    },
    {
      name: 'Massimiliano Luca',
      institutions: ['fbk'],
      photo: 'assets/photos/Massimiliano.jpg',
      bio: 'Senior Researcher in the Mobile and Social Computing Lab (MoBS) at Fondazione Bruno Kessler (FBK) in Trento, Italy. He holds a PhD in Computer Science from the Free University of Bozen-Bolzano and held visiting positions at the MIT Media Lab and IFISC, receiving the Complex Systems Society Emerging Scientist Award in 2025. His research integrates spatially aware deep learning, foundation models, and complex systems to forecast routine and out-of-routine human mobility.'
    },
    {
      name: 'Mariana Macedo',
      institutions: ['construct'],
      photo: 'assets/photos/mariana.jpg',
      aliases: ['Mariana Gomes da Motta Macedo'],
      bio: 'Assistant Professor of Computer Science and Engineering at Constructor University in Bremen, Germany. Collaborating closely with complexity and network science groups including the BioComplex Laboratory, her work sits at the intersection of network science, data science, and human dynamics. Her research investigates gender and socioeconomic disparities in urban human mobility, academic career mobility, and multi-objective swarm optimization.'
    },
    {
      name: 'Giovanni Mauro',
      institutions: ['isti'],
      photo: 'assets/photos/giovanni.png',
      bio: 'Artificial intelligence and human mobility researcher collaborating with the Knowledge Discovery and Data Mining Laboratory (KDD Lab) at ISTI-CNR in Pisa. He holds an MSc in Data Science from UPC BarcelonaTech, pursued a PhD in Artificial Intelligence at Scuola Normale Superiore, and visited the University of Oxford and Barcelona Supercomputing Center. His research develops generative models for human mobility trajectories and investigates urban segregation and gentrification.'
    },
    {
      name: 'Mattia Mazzoli',
      institutions: ['isi'],
      photo: 'assets/photos/Mattia.jpg',
      bio: 'Senior Research Scientist at the ISI Foundation in Turin, Italy. He earned his PhD in Physics of Complex Systems at IFISC (CSIC-UIB) in Palma de Mallorca and completed postdoctoral research at the EPIcx Lab (INSERM and Sorbonne Université) in Paris. His research integrates human mobility data and commuter networks into spatial epidemic modeling and digital disease surveillance to study urban transmission dynamics and public health preparedness.'
    },
    {
      name: 'Ronaldo Menezes',
      institutions: ['exeter'],
      photo: 'assets/photos/ronaldo.jpeg',
      aliases: ['Ronaldo Parente de Menezes'],
      bio: 'Professor of Data and Network Science, Head of the Department of Computer Science, and Director of the BioComplex Laboratory at the University of Exeter. A founding member of CompleNet, board member of the NetSci Society, and co-editor-in-chief of Applied Network Science, he plays a leading role in complex systems research. His work examines network science, human dynamics and mobility, collective behaviour, and urban systems.'
    },
    {
      name: 'Diogo Pacheco',
      institutions: ['exeter'],
      photo: 'assets/photos/Diogo.jpeg',
      aliases: ['Diogo Ferreira Pacheco'],
      bio: 'Senior Lecturer in Computer Science and Data Science at the University of Exeter, member of the BioComplex Laboratory, and affiliated with The Alan Turing Institute. He earned his PhD from Florida Institute of Technology and was a Postdoctoral Research Scientist at Indiana University\'s Center for Complex Networks and Systems Research. His research combines network science and computational social science to study dynamic human mobility predictability and online ecosystems.'
    },
    {
      name: 'Luca Pappalardo',
      institutions: ['isti'],
      photo: 'assets/photos/luca.jpeg',
      bio: 'Senior Researcher at ISTI-CNR in Pisa within the Knowledge Discovery and Data Mining Laboratory (KDD Lab) and Associate Professor at Scuola Normale Superiore. He earned his PhD in Computer Science from the University of Pisa, visited the Barabási Lab and CEU, and co-developed the scikit-mobility Python library. His research spans human-centered AI, generative mobility modeling such as Deep Gravity, computational social science, and sports analytics.'
    },
    {
      name: 'José Javier Ramasco',
      institutions: ['ifisc'],
      photo: 'assets/photos/Ramasco.png',
      aliases: ['José J. Ramasco'],
      bio: 'CSIC Research Professor and Director of the Institute for Cross-Disciplinary Physics and Complex Systems (IFISC, CSIC-UIB) in Palma de Mallorca. After earning his PhD at the University of Cantabria, he held positions at the University of Porto, Emory University, and the ISI Foundation in Turin. His research applies statistical physics and big data to human mobility modeling, transport networks, community detection, and spatial epidemic spreading.'
    },
    {
      name: 'Lavinia Rossi Mori',
      institutions: ['sony'],
      photo: 'assets/photos/LaviniaRossiMori.jpg',
      bio: 'PhD researcher in complex systems and urban data science affiliated with Sony Computer Science Laboratories (Sony CSL) – Rome, the Enrico Fermi Research Center (CREF), and Sapienza University of Rome. Using statistical physics, network science, and high-resolution spatial data, she studies how urban form shapes everyday human movement. Her research focuses on the 15-minute city, local service accessibility, socio-spatial segregation, and transport carbon intensity.'
    },
    {
      name: 'Kamil Smolak',
      institutions: ['upwr'],
      photo: 'assets/photos/kamil.jpg',
      bio: 'Assistant Professor at the Institute of Geodesy and Geoinformatics, Wrocław University of Environmental and Life Sciences (UPWR), where he also earned his PhD. Awarded a NAWA Bekker postdoctoral fellowship, he collaborates closely on human mobility research with the KDD Lab at ISTI-CNR in Pisa. His work integrates GIScience, spatio-temporal data mining, and machine learning to study movement predictability, algorithmic fairness in urban mobility, and movement ecology.'
    }
  ],

  TOPIC_STYLES: {
    'Human Mobility':         { pill: 'bg-teal-50 text-teal-700 ring-teal-500/30',     active: 'bg-teal-600 text-white ring-teal-600',     dot: 'bg-teal-500' },
    'Urban & Cities':         { pill: 'bg-brand-50 text-brand-700 ring-brand-500/30',  active: 'bg-brand-700 text-white ring-brand-700',   dot: 'bg-brand-500' },
    'Transport & Transit':    { pill: 'bg-sky-50 text-sky-700 ring-sky-500/30',        active: 'bg-sky-600 text-white ring-sky-600',       dot: 'bg-sky-500' },
    'Segregation & Equity':   { pill: 'bg-amber-50 text-amber-800 ring-amber-500/30',  active: 'bg-amber-600 text-white ring-amber-600',   dot: 'bg-amber-500' },
    'Epidemics & Resilience': { pill: 'bg-rose-50 text-rose-700 ring-rose-500/30',     active: 'bg-rose-600 text-white ring-rose-600',     dot: 'bg-rose-500' },
    'Urban AI & Sensing':     { pill: 'bg-violet-50 text-violet-700 ring-violet-500/30', active: 'bg-violet-600 text-white ring-violet-600', dot: 'bg-violet-500' }
  }
};
