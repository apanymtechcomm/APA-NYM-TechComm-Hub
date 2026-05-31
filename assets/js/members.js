/* === APA NYM TechComm — Members Page (Modal + Interactivity) === */

(function () {
  'use strict';

  // Member profile data
  var profiles = {
    'andrew-buck': {
      name: 'Andrew Buck, AICP, ENV SP',
      role: 'Co-Chair',
      hue: 210,
      initials: 'AB',
      bio: 'Andrew is an infrastructure planner and sustainability strategist at VHB, where he leads multidisciplinary teams delivering transit, energy, and resilience projects across the New York metro region. As Co-Chair of the APA NYM Technology Committee, he focuses on connecting planners with practical technology tools — from GIS to building performance modeling — and building a community where practitioners can learn from each other. He believes the best planning outcomes happen when technology serves people, not the other way around.'
    },
    'claire-yang': {
      name: 'Claire Yang',
      role: 'Co-Chair',
      hue: 195,
      initials: 'CY',
      bio: 'Claire bridges data science and urban policy, working to make planning processes more transparent and community-driven. She brings experience in civic technology and quantitative analysis to the committee, advocating for tools that give residents a real voice in shaping their neighborhoods. Her approach centers on making complex data accessible without oversimplifying the challenges cities face.'
    },
    'savannah-wu': {
      name: 'Savannah Wu',
      role: 'Co-Chair',
      hue: 180,
      initials: 'SW',
      bio: 'Savannah focuses on equitable technology access in planning, ensuring that digital tools don\'t just serve well-resourced communities but reach neighborhoods that need them most. She leads community-building efforts within the committee and champions initiatives that lower the barrier to entry for planners exploring new technologies. Her work is grounded in the belief that inclusive technology practice produces better planning outcomes.'
    },
    'ian-hartz': {
      name: 'Ian Hartz',
      role: 'Secretary',
      hue: 225,
      initials: 'IH',
      bio: 'Ian keeps the committee organized and on track, drawing on deep experience in transportation planning at MTA. He manages scheduling, documentation, and coordination across committee initiatives, ensuring that good ideas turn into finished work. His background in one of the nation\'s largest transit agencies gives him practical insight into how technology adoption actually works inside complex public organizations.'
    },
    'olivia-jovine': {
      name: 'Olivia Jovine',
      role: 'Founding Co-Chair, Advisor',
      hue: 240,
      initials: 'OJ',
      bio: 'A founding force behind the APA NYM Technology Committee, Olivia brings institutional knowledge and a passion for planning innovation that spans decades of practice. As an advisor, she helps the current leadership navigate the committee\'s strategic direction while staying connected to the broader APA community. Her experience building the committee from scratch informs how it operates today.'
    },
    'kelly-richardson': {
      name: 'Kelly Richardson',
      role: 'Founding Co-Chair, Advisor',
      hue: 260,
      initials: 'KR',
      bio: 'Kelly is a veteran of NYC Housing Preservation & Development, where she saw firsthand how technology can improve — or hinder — the delivery of affordable housing and community services. As a founding co-chair turned advisor, she helps shape the committee\'s long-term direction and maintains critical community connections across the New York metro planning ecosystem.'
    },
    'jack-darcey': {
      name: 'Jack Darcey',
      role: 'NYC Department of City Planning',
      hue: 200,
      initials: 'JD',
      bio: 'Jack works at the intersection of urban data and policy at NYC Department of City Planning, helping the city make smarter decisions about land use, zoning, and neighborhood change. He brings an inside perspective on how NYC\'s planning apparatus adopts — and struggles with — new technology, and advocates for open data and interoperable tools that serve both agency staff and the public.'
    },
    'megan-marini': {
      name: 'Megan Marini',
      role: '3x3',
      hue: 170,
      initials: 'MM',
      bio: 'Megan designs technology solutions at 3x3 that make complex planning processes more accessible and human-centered. Her work spans digital engagement platforms, participatory design tools, and community-facing dashboards. She brings a design-thinking mindset to the committee, always asking whether a tool actually helps the person using it — or just looks impressive on a demo slide.'
    },
    'alana-pogostin': {
      name: 'Alana Pogostin',
      role: 'Esri',
      hue: 155,
      initials: 'AP',
      bio: 'Alana connects planners with geospatial tools at Esri, helping teams leverage GIS for smarter decision-making across planning disciplines. She understands both the technical capabilities of modern mapping platforms and the practical constraints that planning departments face when adopting them. Her committee focus is on demystifying GIS and making spatial analysis a natural part of every planner\'s workflow.'
    },
    'alice-friedman': {
      name: 'Alice Friedman',
      role: 'Geotab',
      hue: 140,
      initials: 'AF',
      bio: 'Alice brings transportation data analytics to the planning world, turning vehicle telematics and mobility data into actionable urban insights. At Geotab, she works at the frontier of how movement data can inform infrastructure investment, traffic safety, and emissions reduction. She advocates for planners to treat transportation data as a core planning resource, not just an engineering afterthought.'
    },
    'ashley-louie': {
      name: 'Ashley Louie',
      role: 'MIT',
      hue: 270,
      initials: 'AL',
      bio: 'Ashley researches how emerging technologies can improve urban governance and community engagement in planning, drawing on MIT\'s deep bench of urban science and civic technology expertise. Her work explores the tension between algorithmic decision-making and democratic participation, and she brings an academic rigor to the committee that grounds technology conversations in real social impact.'
    },
    'lauren-wang': {
      name: 'Lauren Wang',
      role: 'Trust for Governors Island',
      hue: 285,
      initials: 'LW',
      bio: 'Lauren advances climate resilience and adaptive reuse strategies at the Trust for Governors Island, connecting technology with place-based stewardship. Her work spans environmental monitoring, green infrastructure modeling, and public space programming — all informed by data-driven approaches to managing New York\'s most visible climate adaptation laboratory. She brings a practitioner\'s eye to how technology supports on-the-ground resilience work.'
    },
    'nick-kaufmann': {
      name: 'Nick Kaufmann',
      role: 'InCitu',
      hue: 300,
      initials: 'NK',
      bio: 'Nick builds tools for community-informed development at InCitu, making planning more participatory through digital engagement platforms that let residents see, react to, and shape proposed changes in their neighborhoods. He\'s focused on closing the gap between the technical sophistication of planning analysis and the accessibility of public-facing engagement — because the best plan is one the community actually understands and supports.'
    },
    'hilary-ho': {
      name: 'Hilary Ho',
      role: 'HR&A',
      hue: 320,
      initials: 'HH',
      bio: 'Hilary advises on urban economics and real estate strategy at HR&A, bringing financial rigor to technology-informed planning decisions. She evaluates whether tech interventions deliver real economic value — for cities, developers, and communities alike. Her perspective helps the committee ground ambitious technology ideas in the fiscal realities that determine whether they get funded and built.'
    }
  };

  // DOM elements
  var overlay = document.getElementById('member-modal');
  var modalName = document.getElementById('modal-name');
  var modalRole = document.getElementById('modal-role');
  var modalPhoto = document.getElementById('modal-photo');
  var modalInitials = document.getElementById('modal-initials');
  var modalBio = document.getElementById('modal-bio');
  var modalClose = document.querySelector('.modal-close');

  // Open modal
  function openModal(memberKey) {
    var data = profiles[memberKey];
    if (!data) return;

    modalName.textContent = data.name;
    modalRole.textContent = data.role;
    modalBio.textContent = data.bio;
    modalInitials.textContent = data.initials;
    modalPhoto.style.setProperty('--hue', data.hue);
    modalPhoto.style.background = 'hsl(' + data.hue + ', 80%, 25%)';
    modalPhoto.style.borderColor = 'hsl(' + data.hue + ', 60%, 45%)';

    overlay.removeAttribute('hidden');
    // Force reflow for animation
    overlay.offsetHeight;
    overlay.classList.add('active');

    modalClose.focus();
    document.body.style.overflow = 'hidden';
  }

  // Close modal
  function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    // Return focus to the card that opened the modal
    var activeCard = document.querySelector('.member-card:focus');
    if (activeCard) {
      activeCard.focus();
    }
    setTimeout(function () {
      overlay.setAttribute('hidden', '');
    }, 250);
  }

  // Bind card clicks
  var cards = document.querySelectorAll('.member-card');
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      openModal(card.getAttribute('data-member'));
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(card.getAttribute('data-member'));
      }
    });
  });

  // Close handlers
  modalClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeModal();
    }
  });
})();