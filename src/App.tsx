/* eslint-disable prefer-const */
import { useState, useEffect } from 'react';
import { PlusCircle, Bus, School as SchoolIcon, List, Copy, Check, ClipboardList, Link as LinkIcon } from 'lucide-react';
import LZString from 'lz-string';
import { School, Student, Bus as BusType } from './types';
import { TutorialModal } from './components/TutorialModal';
import { UpdateModal } from './components/UpdateModal';

function App() {
  const [view, setView] = useState<'input' | 'management' | 'chamada'>('input');
  const [schools, setSchools] = useState<School[]>([]);
  const [fullList, setFullList] = useState('');
  const [buses, setBuses] = useState<BusType[]>([]);
  const [newBusSeats, setNewBusSeats] = useState<number>(0);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [availableUnifipStudents, setAvailableUnifipStudents] = useState<string[]>([]);
  const [copiedBusId, setCopiedBusId] = useState<number | null>(null);
  const [driverName, setDriverName] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [totalStudents, setTotalStudents] = useState<number>(0); // Para armazenar o total de alunos
  const [darkMode, setDarkMode] = useState(false);
  const [isManualBusCreation, setIsManualBusCreation] = useState(false);
  const [selectedUnifipStudents, setSelectedUnifipStudents] = useState<string[]>([]);
  const [remainingSeats, setRemainingSeats] = useState<number>(0);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [unifipStudentSearch, setUnifipStudentSearch] = useState('');

  // --- Estados da Chamada ---
  const [chamadaRawList, setChamadaRawList] = useState('');
  interface ChamadaBus { id: number; name: string; students: { name: string; school: string; status: 'pending' | 'present' | 'absent' | 'volta' | 'relocated'; relocatedFrom?: string; relocatedTo?: string }[] }
  const [parsedChamadaBuses, setParsedChamadaBuses] = useState<ChamadaBus[]>([]);
  const [selectedChamadaBus, setSelectedChamadaBus] = useState<ChamadaBus | null>(null);
  const [chamadaCopied, setChamadaCopied] = useState(false);
  const [isChamadaHelpOpen, setIsChamadaHelpOpen] = useState(false);
  const [chamadaPopupIndex, setChamadaPopupIndex] = useState<number | null>(null);
  const [relocateModalIndex, setRelocateModalIndex] = useState<number | null>(null);
  const [bringModal, setBringModal] = useState<{ step: 'bus' | 'student'; sourceBusId: number | null; search: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    if (data) {
      try {
        const decoded = LZString.decompressFromEncodedURIComponent(data);
        if (!decoded) throw new Error("invalid string");
        setChamadaRawList(decoded);
        setView('chamada');
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        console.error('Failed to decode data from URL', err);
        alert('Link mágico inválido ou corrompido.');
      }
    }
  }, []);

  const generateMagicLink = async (text: string, id: string) => {
    try {
      // 1. Comprime a lista inteira (o link original continua existindo)
      const encoded = LZString.compressToEncodedURIComponent(text);
      const fullUrl = `${window.location.origin}${window.location.pathname}?data=${encoded}`;
      
      let finalUrl = fullUrl;
      
      try {
        // Mostramos um estado de "carregando" visualmente se possível (opcional)
        setCopiedLink('loading-' + id);
        
        // 2. Chamamos a API do TinyURL. Como APIs públicas bloqueiam chamadas diretas de Browsers (CORS),
        // usamos o proxy gratuito allorigins para fazer a ponte de forma invisível.
        const tinyApiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(fullUrl)}`;
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(tinyApiUrl)}`);
        
        if (response.ok) {
          const data = await response.json();
          // O TinyURL devolve "Error" se o domínio for localhost. Se for um domínio real, devolve o link curto.
          if (data.contents && data.contents.startsWith('http') && !data.contents.toLowerCase().includes('error')) {
            finalUrl = data.contents;
          } else {
            console.warn('TinyURL recusou o domínio (provavelmente por ser localhost). Usando URL gigante como fallback.');
          }
        }
      } catch (e) {
        console.warn('Serviço de encurtador fora do ar ou bloqueado. Usando URL padrão.', e);
      }

      // 3. Copia a URL final (curta ou longa) para a prancheta
      await navigator.clipboard.writeText(finalUrl);
      setCopiedLink(id);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      alert('Erro ao gerar link. A tela pode ter travado.');
      setCopiedLink(null);
    }
  };

  const parseSchoolList = (text: string) => {
    const schools: School[] = [];
    let currentSchool: School | null = null;

    const lines = text.split('\n').map(line => line.trim());

    for (let line of lines) {
      if (!line) continue;

      const cleanedLine = line.replace(/[*\-]/g, '').trim();

      if (cleanedLine.toUpperCase().startsWith('LISTA') && !cleanedLine.includes('17/02')) {
        const schoolName = cleanedLine.replace(/^LISTA\s+/i, '').trim();
        currentSchool = {
          name: schoolName,
          students: []
        };
        schools.push(currentSchool);
      } else if (currentSchool) {
        const numberMatch = cleanedLine.match(/^(\d+)[\.\-\s]?\s*(.+)$/);
        if (numberMatch) {
          let studentName = numberMatch[2].trim();

          // Ignorar se o nome estiver vazio ou se for um número isolado
          if (!studentName || studentName === '.' || !isNaN(Number(studentName))) {
            continue;
          }

          // Remover qualquer sufixo "VOLTA" ou "IDA" que possa ter sido adicionado anteriormente
          studentName = studentName.replace(/\s*-\s*(VOLTA|IDA)\s*/gi, '').trim();

          // Flag para verificar se os sufixos já foram adicionados
          let addedVolta = false;
          let addedIda = false;

          // Verifica se "VOLTA" aparece no nome e adiciona ao final se não foi adicionado
          if (/\bvolta\b/i.test(studentName) && !addedVolta) {
            studentName = studentName.replace(/\bvolta\b/i, '').trim(); // Remove a palavra "volta" se estiver no nome
            studentName += ' - VOLTA';  // Adiciona o sufixo "VOLTA" ao final
            addedVolta = true;
          }

          // Verifica e adiciona "IDA" uma única vez
          if (/\bida\b/i.test(studentName) && !addedIda) {
            studentName += ' - IDA';
            addedIda = true;
          }

          // Corrige casos de "UNIFIP-VOLTA" ou similar
          studentName = studentName.replace(/([a-zA-Z]+)-VOLTA/i, '$1 - VOLTA');

          // Remove o nome da faculdade (UNIFIP) do nome do aluno
          studentName = studentName.replace(/\s*(\([^\)]*\)|UNIFIP|unifip|UFCG|ifpb|rhema|laboratório-uniplan|cursinho guedes\/conexão saúde|itec|uepb|uniplan|ecisa|unopar|uninaselvi)\s*/gi, '').trim();

          // Separar o nome, sobrenome e a instituição (caso seja o nome da instituição no formato "(UFCG)" ou similar)
          const institutionMatch = studentName.match(/\(([^)]+)\)$/);
          if (institutionMatch) {
            studentName = studentName.replace(/\s*\([^\)]*\)/, '').trim();  // Remove a instituição do nome
            const institution = institutionMatch[1].trim();
            if (institution) {
              studentName += ` (${institution})`;
            }
          }

          if (studentName && studentName !== '.') {
            currentSchool.students.push(studentName);
          }
        }
      }
    }

    return schools;
  };

  const handleProcessList = () => {
    if (!fullList.trim()) {
      alert('Por favor, cole a lista completa');
      return;
    }

    const parsedSchools = parseSchoolList(fullList);
    if (parsedSchools.length === 0) {
      alert('Nenhuma universidade foi encontrada na lista');
      return;
    }

    // Inicializa os alunos disponíveis da UNIFIP
    const unifipSchool = parsedSchools.find(s => s.name === 'UNIFIP');
    if (unifipSchool && unifipSchool.students.length > 0) {
      setAvailableUnifipStudents(unifipSchool.students);
    }

    // Filtra as escolas para que apenas aquelas com alunos sejam exibidas
    const filteredSchools = parsedSchools.filter(s => s.students.length > 0);

    // Calcular o total de alunos em todas as escolas
    const total = filteredSchools.reduce((acc, school) => acc + school.students.length, 0);
    setTotalStudents(total); // Armazenar o total de alunos

    // Adiciona o total de alunos ao nome da escola para exibição
    const schoolsWithStudentCount = filteredSchools.map(school => ({
      name: school.name,  // Nome da escola sem o número de alunos
      displayName: `${school.name} - ${school.students.length} alunos`, // Nome da escola com o número de alunos
      students: school.students
    }));

    setSchools(schoolsWithStudentCount);
    setFullList('');
  };




  const createBus = () => {
    if (newBusSeats <= 0) {
      alert('Por favor, insira um número válido de assentos');
      return;
    }

    let students: Student[] = [];

    // Add students from selected schools
    selectedSchools.forEach(schoolName => {
      const school = schools.find(s => s.name === schoolName);
      if (school) {
        students = [...students, ...school.students.map(name => ({
          name,
          school: schoolName
        }))];
      }
    });

    // Fill remaining seats with available UNIFIP students if needed
    if (students.length < newBusSeats && availableUnifipStudents.length > 0) {
      const remainingSeats = newBusSeats - students.length;
      const unifipStudentsToAdd = availableUnifipStudents
        .slice(0, remainingSeats)
        .map(name => ({
          name,
          school: 'UNIFIP'
        }));

      students = [...students, ...unifipStudentsToAdd];

      // Update available UNIFIP students
      setAvailableUnifipStudents(prev =>
        prev.slice(unifipStudentsToAdd.length)
      );
    }

    // Create the bus name based on selected schools and driver name
    const busName = `${driverName ? `${driverName.toUpperCase()} - ` : ''}ÔNIBUS ${String(buses.length + 1).padStart(2, '0')} - ${selectedSchools.length > 0
      ? selectedSchools.join(', ')
      : 'UNIFIP'} (${newBusSeats} VAGAS)`;

    const newBus: BusType = {
      id: buses.length + 1,
      name: busName,  // Updated bus name to include driver name
      seats: newBusSeats,
      schools: selectedSchools.length > 0 ? selectedSchools : ['UNIFIP'],  // Ensure UNIFIP is set if no schools are selected
      students
    };

    // Remove selected schools from the available schools list
    setSchools(prev => prev.filter(school => !selectedSchools.includes(school.name)));

    setBuses([...buses, newBus]);
    setNewBusSeats(0);
    setSelectedSchools([]); // Clear selected schools after bus creation

    // Clear driver name after bus creation to avoid repetition
    setDriverName('');
  };

  const toggleSchool = (schoolName: string) => {
    // Verifica se a escola "UNIFIP" está na lista de selecionadas
    if (schoolName.startsWith('UNIFIP')) {
      return;  // Não permite que UNIFIP seja manualmente selecionada ou desmarcada
    }

    // Extrai o nome da escola sem a quantidade de alunos
    const schoolWithoutCount = schoolName.split(' - ')[0];

    // Verifica se a escola já foi selecionada
    if (selectedSchools.includes(schoolWithoutCount)) {
      // Se estiver selecionada, desmarque-a (remova da lista)
      setSelectedSchools(prev => prev.filter(school => school !== schoolWithoutCount));
    } else {
      // Se não estiver selecionada, a adicione à lista de selecionadas
      setSelectedSchools(prev => [...prev, schoolWithoutCount]);
    }
  };




  const copyBusList = (bus: BusType) => {
    const text = `LISTA ÔNIBUS ${String(bus.id).padStart(2, '0')} - ${bus.name.includes(" - ") ? `${bus.name.split(" - ")[0].toUpperCase()} - ` : ''}${bus.schools.join(', ')} (${bus.seats} VAGAS)\n\n${bus.students.map((student, index) => `${index + 1}. ${student.name} (${student.school})`).join('\n')}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedBusId(bus.id);
      setTimeout(() => setCopiedBusId(null), 2000);
    });
  };

  const copyAllBusLists = () => {
    const date = new Date().toLocaleDateString('pt-BR'); // Formato "dd/mm"
    const text = `LISTA ${date}\n\n` + buses.map(bus => `LISTA ÔNIBUS ${String(bus.id).padStart(2, '0')} - ${bus.name.includes(" - ") ? `${bus.name.split(" - ")[0].toUpperCase()} - ` : ''}${bus.schools.join(', ')} (${bus.seats} VAGAS)\n\n${bus.students.map((student, index) => `${index + 1}. ${student.name} (${student.school})`).join('\n')}`).join('\n\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopiedBusId(null);
      setTimeout(() => setCopiedBusId(null), 2000);
    });
  };


  const deleteStudentFromBus = (busId: number, studentIndex: number) => {
    // Encontra o ônibus
    const busToUpdate = buses.find(bus => bus.id === busId);
    if (busToUpdate) {
      // Remove o aluno da lista de estudantes do ônibus
      const updatedStudents = busToUpdate.students.filter((_, index) => index !== studentIndex);

      // Atualiza o ônibus com a lista de estudantes atualizada
      const updatedBus = { ...busToUpdate, students: updatedStudents };
      setBuses(prevBuses => prevBuses.map(bus => (bus.id === busId ? updatedBus : bus)));
    }
  };

  const handleDriverChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedDriver(value);

    // Se "Outro" for selecionado, permite digitar o nome do motorista
    if (value !== 'Outro') {
      setDriverName(value); // Atribui o valor selecionado ao driverName
    } else {
      setDriverName(''); // Limpa o nome do motorista caso "Outro" seja selecionado
    }
  };

  const handleStudentSelection = (student: string) => {
    // Verifica se o aluno está selecionado
    if (selectedUnifipStudents.includes(student)) {
      // Remove o aluno da lista de selecionados
      setSelectedUnifipStudents(prev => prev.filter(s => s !== student));
    } else {
      // Se o número de alunos selecionados for menor que a quantidade de vagas restantes, adiciona o aluno
      if (selectedUnifipStudents.length < remainingSeats) {
        setSelectedUnifipStudents(prev => [...prev, student]);
      } else {
        alert('Você não pode selecionar mais alunos do que as vagas restantes.');
      }
    }
  };


  const createBusManually = () => {
    if (newBusSeats <= 0) {
      alert('Por favor, insira um número válido de assentos');
      return;
    }

    let students: Student[] = [];

    // Adiciona os alunos das escolas selecionadas
    selectedSchools.forEach(schoolName => {
      const school = schools.find(s => s.name === schoolName);
      if (school) {
        students = [...students, ...school.students.map(name => ({
          name,
          school: schoolName
        }))];
      }
    });

    // Calcula os assentos restantes
    const remainingSeats = newBusSeats - students.length;

    // Verifica se precisa preencher os assentos restantes com alunos da UNIFIP
    if (remainingSeats > 0 && availableUnifipStudents.length > 0) {
      setIsManualBusCreation(true);  // Habilita a tela/modal para selecionar alunos
      setRemainingSeats(remainingSeats);  // Define remainingSeats no estado
    }


  };



  const finalizeBusCreation = () => {
    if (selectedUnifipStudents.length === remainingSeats) {
      let students: Student[] = [];

      // Adiciona os alunos das escolas selecionadas
      selectedSchools.forEach(schoolName => {
        const school = schools.find(s => s.name === schoolName);
        if (school) {
          students = [...students, ...school.students.map(name => ({
            name,
            school: schoolName
          }))];
        }
      });

      // Adiciona os alunos da UNIFIP selecionados
      selectedUnifipStudents.forEach(studentName => {
        students.push({
          name: studentName,
          school: 'UNIFIP'
        });
      });

      // Cria o ônibus
      const busName = `${driverName ? `${driverName.toUpperCase()} - ` : ''}ÔNIBUS ${String(buses.length + 1).padStart(2, '0')} - ${selectedSchools.length > 0
        ? selectedSchools.join(', ')
        : 'UNIFIP'} (${newBusSeats} VAGAS)`;

      const newBus: BusType = {
        id: buses.length + 1,
        name: busName,
        seats: newBusSeats,
        schools: selectedSchools.length > 0 ? selectedSchools : ['UNIFIP'],
        students
      };

      setBuses([...buses, newBus]);
      setAvailableUnifipStudents(prev => prev.filter(student => !selectedUnifipStudents.includes(student)));
      setNewBusSeats(0);
      setSelectedSchools([]);  // Limpa as escolas selecionadas
      setDriverName('');
      setIsManualBusCreation(false);  // Fecha a tela/modal
      setSelectedUnifipStudents([]);  // Limpa a seleção de alunos da UNIFIP
      setUnifipStudentSearch('');  // Limpa o campo de busca

      // Remove as universidades selecionadas da lista de escolas disponíveis
      setSchools(prev => prev.filter(school => !selectedSchools.includes(school.name)));

    } else {
      alert('Selecione o número correto de alunos da UNIFIP para preencher os assentos.');
    }
  };

  // --- Parser da lista formatada para a Chamada ---
  const parseChamadaList = (text: string): ChamadaBus[] => {
    const buses: ChamadaBus[] = [];
    let currentBus: ChamadaBus | null = null;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
      // Detecta cabeçalho de ônibus ex: "LISTA ÔNIBUS 01 - BAMBA - UEPB (5 VAGAS)"
      const busHeaderMatch = line.match(/LISTA\s+[ÔO]NIBUS\s+(\d+)\s*[-–]\s*(.+)/i);
      if (busHeaderMatch) {
        currentBus = { id: parseInt(busHeaderMatch[1]), name: line, students: [] };
        buses.push(currentBus);
        continue;
      }
      // Detecta aluno ex: "1. Daira Eve (UEPB)"
      if (currentBus) {
        const studentMatch = line.match(/^\d+[\.\-\s]+(.+)$/);
        if (studentMatch) {
          const raw = studentMatch[1].trim();
          // Extrai escola do final: "Nome (ESCOLA)"
          const schoolMatch = raw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
          if (schoolMatch) {
            const name = schoolMatch[1].trim();
            const isVolta = /\bvolta\b/i.test(name);
            currentBus.students.push({ name, school: schoolMatch[2].trim(), status: isVolta ? 'volta' : 'pending' });
          } else {
            const name = raw;
            const isVolta = /\bvolta\b/i.test(name);
            currentBus.students.push({ name, school: '', status: isVolta ? 'volta' : 'pending' });
          }
        }
      }
    }
    return buses;
  };

  const handleProcessChamada = () => {
    if (!chamadaRawList.trim()) { alert('Cole a lista formatada antes de continuar.'); return; }
    const result = parseChamadaList(chamadaRawList);
    if (result.length === 0) { alert('Nenhum ônibus encontrado na lista.'); return; }
    setParsedChamadaBuses(result);
    setSelectedChamadaBus(result.length === 1 ? result[0] : null);
  };

  const setStudentStatus = (studentIndex: number, status: 'present' | 'absent' | 'volta' | 'relocated') => {
    if (!selectedChamadaBus) return;
    const updated = { ...selectedChamadaBus, students: selectedChamadaBus.students.map((s, i) => i === studentIndex ? { ...s, status } : s) };
    setSelectedChamadaBus(updated);
    setParsedChamadaBuses(prev => prev.map(b => b.id === updated.id ? updated : b));
    setChamadaPopupIndex(null);
  };

  const setStudentRelocated = (studentIndex: number, toDriver: string) => {
    if (!selectedChamadaBus) return;
    const updated = { ...selectedChamadaBus, students: selectedChamadaBus.students.map((s, i) => i === studentIndex ? { ...s, status: 'relocated' as const, relocatedTo: toDriver, relocatedFrom: undefined } : s) };
    setSelectedChamadaBus(updated);
    setParsedChamadaBuses(prev => prev.map(b => b.id === updated.id ? updated : b));
    setChamadaPopupIndex(null);
    setRelocateModalIndex(null);
  };

  const resetChamada = () => {
    setChamadaRawList('');
    setParsedChamadaBuses([]);
    setSelectedChamadaBus(null);
    setChamadaCopied(false);
    setChamadaPopupIndex(null);
  };

  const bringStudentFromBus = (student: { name: string; school: string }, sourceBus: { id: number; name: string }) => {
    if (!selectedChamadaBus) return;
    const driverMatch = sourceBus.name.match(/LISTA\s+[ÔO]NIBUS\s+\d+\s*[-–]\s*([^-–]+)\s*[-–]/i);
    const driver = driverMatch ? driverMatch[1].trim() : `Ônibus ${sourceBus.id}`;
    const newStudent = { ...student, status: 'relocated' as const, relocatedFrom: driver };
    const updated = { ...selectedChamadaBus, students: [...selectedChamadaBus.students, newStudent] };
    setSelectedChamadaBus(updated);
    setParsedChamadaBuses(prev => prev.map(b => b.id === updated.id ? updated : b));
    setBringModal(null);
  };

  const copyChamadaList = () => {
    if (!selectedChamadaBus) return;
    const header = selectedChamadaBus.name; // linha original da lista
    const lines = selectedChamadaBus.students
      .map((s, i) => {
        const icon = s.status === 'present' ? ' ✅'
          : s.status === 'absent' ? ' ❌'
          : s.status === 'relocated'
            ? ` 🔄${s.relocatedTo ? ` (REMANEJADO PARA: ${s.relocatedTo})` : s.relocatedFrom ? ` (REMANEJADO DE: ${s.relocatedFrom})` : ''}`
          : s.status === 'volta' ? ' 🔙' : '';
        return `${i + 1}. ${s.name}${s.school ? ` (${s.school})` : ''}${icon}`;
      })
      .join('\n');
    navigator.clipboard.writeText(`${header}\n\n${lines}`).then(() => {
      setChamadaCopied(true);
      setTimeout(() => setChamadaCopied(false), 2000);
    });
  };

  return (
    <div className={`min-h-screen p-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="flex justify-end mb-4 gap-4">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Dark Mode</span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full ${darkMode ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            <span
              className={`${darkMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}
            />
          </button>
        </div>
        <button
          onClick={() => setIsTutorialOpen(true)}
          className={`${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-md flex items-center gap-2`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Ajuda
        </button>
      </div>

      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} darkMode={darkMode} />
      <UpdateModal darkMode={darkMode} />

      <div className="max-w-4xl mx-auto">
        <h1 className={`text-3xl font-bold mb-8 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <Bus className="w-8 h-8" />
          Sistema de Gerenciamento de Ônibus
        </h1>

        <div className={`grid grid-cols-3 gap-2 mb-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
          <button
            onClick={() => setView('input')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2.5 rounded-md text-sm font-medium transition-colors ${view === 'input'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            <SchoolIcon className="w-4 h-4 flex-shrink-0" />
            <span className="text-center leading-tight">Processar Lista</span>
          </button>
          <button
            onClick={() => setView('management')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2.5 rounded-md text-sm font-medium transition-colors ${view === 'management'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            <List className="w-4 h-4 flex-shrink-0" />
            <span className="text-center leading-tight">Gerenciar Ônibus</span>
          </button>
          <button
            onClick={() => setView('chamada')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2.5 rounded-md text-sm font-medium transition-colors ${view === 'chamada'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            <ClipboardList className="w-4 h-4 flex-shrink-0" />
            <span className="text-center leading-tight">Chamada</span>
          </button>
        </div>

        {view === 'input' && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-8`}>
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Copiar lista completa</h2>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Lista Completa
              </label>
              <textarea
                value={fullList}
                onChange={(e) => setFullList(e.target.value)}
                className={`w-full p-2 border rounded-md h-96 font-mono ${darkMode ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                placeholder="Cole a lista completa aqui..."
              />
            </div>

            <button
              onClick={handleProcessList}
              className={`${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-md flex items-center gap-2`}
            >
              <PlusCircle className="w-5 h-5" />
              Processar Lista
            </button>

            {schools.length > 0 && (
              <div className="mt-8">
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Universidades processadas</h3>
                <div className="space-y-4">
                  {schools.map(school => (
                    <div key={school.name} className={`border rounded-md p-4 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                      <h4 className={`font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{school.name}</h4>
                      <ul className={`list-decimal list-inside ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {school.students.map((student, index) => (
                          <li key={index}>{student}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'management' && (
          <>
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-8`}>
              <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Criar Novo Ônibus</h2>

              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Número de Assentos
                </label>
                <input
                  type="number"
                  value={newBusSeats || ''}
                  onChange={(e) => setNewBusSeats(parseInt(e.target.value) || 0)}
                  className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                  min="1"
                />
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nome do Motorista
                </label>

                {/* Lista de seleção para escolher o motorista */}
                <select
                  value={selectedDriver}
                  onChange={handleDriverChange}
                  className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value="">Selecione um Motorista</option>
                  <option value="França">França</option>
                  <option value="Bamba">Bamba</option>
                  <option value="Baiano">Baiano</option>
                  <option value="Francivaldo">Francivaldo</option>
                  <option value="Henrique">Henrique</option>
                  <option value="Outro">Outro</option>
                </select>

                {/* Exibe o campo de digitação caso a opção "Outro" seja escolhida */}
                {selectedDriver === 'Outro' && (
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className={`w-full mt-2 p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="Digite o nome do motorista"
                  />
                )}
              </div>



              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Selecione as universidades
                </label>
                <div className="space-y-2">
                  {schools
                    .filter(school => school.name !== 'UNIFIP')  // Filtra para não incluir UNIFIP
                    .map(school => (
                      <label key={school.name} className={`flex items-center space-x-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        <input
                          type="checkbox"
                          checked={selectedSchools.includes(school.name)}
                          onChange={() => toggleSchool(school.name)}
                          className={`rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        />
                        <span>{`${school.name} - ${school.students.length} alunos`}</span>
                      </label>
                    ))}
                </div>
              </div>




              {availableUnifipStudents.length > 0 && (
                <div className={`mb-4 p-4 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Alunos UNIFIP disponíveis: {availableUnifipStudents.length}
                  </p>
                </div>
              )}

              {totalStudents > 0 && (
                <div className={`mb-4 p-4 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Total de alunos: {totalStudents}
                  </p>
                </div>
              )}
              <div className="flex space-x-4">
                <button
                  onClick={createBus}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <PlusCircle className="w-5 h-5" />
                  Criar Ônibus
                </button>

                <button
                  onClick={createBusManually}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
                >
                  <PlusCircle className="w-5 h-5" />
                  Criar Ônibus Manualmente
                </button>
              </div>

              {isManualBusCreation && remainingSeats > 0 && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-lg w-full shadow-xl`}>
                    <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                      Selecione os alunos da UNIFIP para preencher os assentos restantes ({remainingSeats - selectedUnifipStudents.length} vagas restantes)
                    </h2>

                    {/* Campo de busca */}
                    <div className="mb-4">
                      <input
                        type="text"
                        value={unifipStudentSearch}
                        onChange={(e) => setUnifipStudentSearch(e.target.value)}
                        placeholder="Buscar aluno..."
                        className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                      />
                    </div>

                    {/* Lista de alunos com scroll */}
                    <div className="max-h-60 overflow-y-auto mb-6">  {/* Controla o tamanho e rolagem */}
                      <ul className="space-y-3">
                        {availableUnifipStudents
                          .filter(student => {
                            const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                            return normalize(student).includes(normalize(unifipStudentSearch));
                          })
                          .map((student, index) => (
                            <li key={index} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`student-search-${index}`}
                                  checked={selectedUnifipStudents.includes(student)}
                                  onChange={() => handleStudentSelection(student)}
                                  className="mr-2"
                                  disabled={selectedUnifipStudents.length >= remainingSeats && !selectedUnifipStudents.includes(student)}  // Desabilita quando as vagas são preenchidas
                                />
                                <label htmlFor={`student-search-${index}`} className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{student}</label>
                              </div>
                            </li>
                          ))}
                      </ul>
                    </div>

                    {/* Botões de ação */}
                    <div className="flex justify-between space-x-4">
                      <button
                        onClick={finalizeBusCreation}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full md:w-auto"
                      >
                        Confirmar Seleção
                      </button>
                      <button
                        onClick={() => { setIsManualBusCreation(false); setUnifipStudentSearch(''); }}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 w-full md:w-auto"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Copiar lista completa</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const date = new Date().toLocaleDateString('pt-BR');
                      const text = `LISTA ${date}\n\n` + buses.map(bus => `LISTA ÔNIBUS ${String(bus.id).padStart(2, '0')} - ${bus.name.includes(" - ") ? `${bus.name.split(" - ")[0].toUpperCase()} - ` : ''}${bus.schools.join(', ')} (${bus.seats} VAGAS)\n\n${bus.students.map((student, index) => `${index + 1}. ${student.name} (${student.school})`).join('\n')}`).join('\n\n');
                      generateMagicLink(text, 'all');
                    }}
                    className={`${darkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'} p-2`}
                    title="Copiar Link Mágico"
                  >
                    {copiedLink === 'all' ? <Check className="w-5 h-5 text-green-500" /> : <LinkIcon className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={copyAllBusLists}
                    className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} p-2`}
                    title="Copiar texto de todas as listas"
                  >
                    {copiedBusId === null ? (
                      <Copy className="w-5 h-5" />
                    ) : (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              {buses.map(bus => (
                <div key={bus.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className={`${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{bus.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const text = `LISTA ÔNIBUS ${String(bus.id).padStart(2, '0')} - ${bus.name.includes(" - ") ? `${bus.name.split(" - ")[0].toUpperCase()} - ` : ''}${bus.schools.join(', ')} (${bus.seats} VAGAS)\n\n${bus.students.map((student, index) => `${index + 1}. ${student.name} (${student.school})`).join('\n')}`;
                          generateMagicLink(text, `bus-${bus.id}`);
                        }}
                        className={`${darkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'} p-2`}
                        title="Copiar Link Mágico"
                      >
                        {copiedLink === `bus-${bus.id}` ? <Check className="w-5 h-5 text-green-500" /> : <LinkIcon className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => copyBusList(bus)}
                        className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} p-2`}
                        title="Copiar texto desta lista"
                      >
                        {copiedBusId === bus.id ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {bus.students.map((student, index) => (
                      <li key={index} className={`flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                        <span>{index + 1}.</span>
                        <span>{student.name}</span>
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>({student.school})</span>
                        <button
                          onClick={() => deleteStudentFromBus(bus.id, index)}
                          className="text-red-500 hover:text-red-700 ml-2"
                          title="Excluir aluno"
                        >
                          Excluir
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

          </>
        )}

        {view === 'chamada' && (
          /* ======== VIEW CHAMADA ======== */
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-8`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold flex items-center gap-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                <ClipboardList className="w-6 h-6 text-blue-500" />
                Chamada
              </h2>
              <div className="flex items-center gap-3">
                {parsedChamadaBuses.length > 0 && (
                  <button
                    onClick={resetChamada}
                    className="text-sm text-red-400 hover:text-red-600 transition-colors"
                  >
                    Limpar e reiniciar
                  </button>
                )}
                {selectedChamadaBus && parsedChamadaBuses.length > 1 && (
                  <button
                    onClick={() => setBringModal({ step: 'bus', sourceBusId: null, search: '' })}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
                      darkMode ? 'bg-blue-700 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    title="Trazer aluno remanejado de outro ônibus"
                  >
                    🔄 Trazer Remanejado
                  </button>
                )}
                <button
                  onClick={() => setIsChamadaHelpOpen(true)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  title="Ajuda"
                >
                  ?
                </button>
              </div>
            </div>

            {/* Modal de ajuda da Chamada */}
            {isChamadaHelpOpen && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className={`${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'} rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto`}>
                  <div className={`sticky top-0 flex items-center justify-between p-5 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-blue-500" />
                      Como usar a Chamada
                    </h3>
                    <button onClick={() => setIsChamadaHelpOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">&times;</button>
                  </div>
                  <div className="p-5 space-y-5">

                    {/* Passo 1 */}
                    <div>
                      <p className="font-semibold text-blue-500 mb-1">① Cole a lista formatada</p>
                      <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Copie a lista gerada pelo sistema e cole no campo de texto. O formato esperado é:
                      </p>
                      <pre className={`text-xs rounded-lg p-3 overflow-x-auto ${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>{`LISTA 17/03/2026

LISTA ÔNIBUS 01 - BAMBA - UEPB (5 VAGAS)

1. Daira Eve (UEPB)
2. Mirelly Sousa (UEPB)
3. Taynara Maria (UEPB)

LISTA ÔNIBUS 02 - FRANÇA - UFCG (3 VAGAS)

1. Letícia Guedes (UFCG)
2. Bruno Wolmer (UFCG)`}</pre>
                    </div>

                    {/* Passo 2 */}
                    <div>
                      <p className="font-semibold text-blue-500 mb-1">② Selecione o ônibus</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Se a lista tiver <strong>mais de um ônibus</strong>, aparecerá uma tela para escolher em qual deseja fazer a chamada. Se tiver <strong>apenas um</strong>, a chamada abre automaticamente.
                      </p>
                    </div>

                    {/* Passo 3 */}
                    <div>
                      <p className="font-semibold text-blue-500 mb-1">③ Faça a chamada de cada aluno</p>
                      <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Clique em qualquer aluno para abrir o menu com 4 opções. Clique novamente no aluno para alterar.
                      </p>
                      <div className={`text-xs rounded-lg p-3 space-y-2 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                        <p className="text-green-500 font-medium">✅ Presente — fundo verde</p>
                        <p className="text-red-400 font-medium">❌ Ausente — fundo vermelho</p>
                        <p className="text-amber-400 font-medium">🔙 Volta — fundo âmbar (só vai na volta)</p>
                        <p className="text-blue-400 font-medium">🔄 Remanejado — fundo azul</p>
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>⬜ Pendente — ainda não chamado</p>
                      </div>
                      <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        <strong>Dica:</strong> alunos com a palavra "VOLTA" no nome já começam marcados com 🔙 automaticamente.
                      </p>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Ao marcar <strong>Remanejado</strong> na lista, você abre um modal para escolher <strong>para qual ônibus</strong> ele foi.
                        <br/>
                        Se precisar trazer alguém de fora, clique no botão <strong className="text-blue-500">🔄 Trazer Remanejado</strong> no topo para buscar e adicionar na lista atual.
                      </p>
                    </div>

                    {/* Passo 4 */}
                    <div>
                      <p className="font-semibold text-blue-500 mb-1">④ Copie o resultado</p>
                      <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Clique em <strong>"Copiar lista"</strong> no cabeçalho. Cada aluno sai com seu ícone de status:
                      </p>
                      <pre className={`text-xs rounded-lg p-3 overflow-x-auto ${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>{`LISTA ÔNIBUS 01 - BAMBA - UEPB (5 VAGAS)

1. Daira Eve (UEPB) ✅
2. Letícia Guedes- VOLTA (UFCG) 🔙
3. Taynara Maria (UEPB) ❌
4. Artur Matos (UEPB) 🔄 (REMANEJADO PARA: LUAN)
5. Adriana Alves (UFCG) 🔄 (REMANEJADO DE: FRANÇA)`}</pre>
                      <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        ✅ presente &nbsp; ❌ ausente &nbsp; 🔙 volta &nbsp; 🔄 remanejado &nbsp; (sem ícone) = pendente
                      </p>
                    </div>

                  </div>
                  <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <button
                      onClick={() => setIsChamadaHelpOpen(false)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      Entendido!
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PASSO 1: Colar a lista */}
            {parsedChamadaBuses.length === 0 && (
              <>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Cole a lista formatada aqui
                    </label>
                    <button
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          setChamadaRawList(text);
                        } catch (err) {
                          alert('Erro ao colar área de transferência. Cole manualmente.');
                        }
                      }}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-colors border shadow-sm font-medium ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'}`}
                      title="Colar da área de transferência"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-blue-500" />
                      Colar
                    </button>
                  </div>
                  <textarea
                    value={chamadaRawList}
                    onChange={e => setChamadaRawList(e.target.value)}
                    className={`w-full p-3 border rounded-md h-64 font-mono text-sm ${darkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                    placeholder={`LISTA 17/03/2026\n\nLISTA ÔNIBUS 01 - BAMBA - UEPB (5 VAGAS)\n\n1. Aluno Um (UEPB)\n2. Aluno Dois (UEPB)\n...`}
                  />
                </div>
                <button
                  onClick={handleProcessChamada}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                >
                  <ClipboardList className="w-5 h-5" />
                  Iniciar Chamada
                </button>
              </>
            )}

            {/* PASSO 2: Selecionar o ônibus (quando há mais de um) */}
            {parsedChamadaBuses.length > 1 && !selectedChamadaBus && (
              <div>
                <p className={`mb-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {parsedChamadaBuses.length} ônibus encontrados. Escolha qual deseja fazer a chamada:
                </p>
                <div className="space-y-3">
                  {parsedChamadaBuses.map(bus => (
                    <button
                      key={bus.id}
                      onClick={() => setSelectedChamadaBus(bus)}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${darkMode
                        ? 'border-gray-600 bg-gray-700 hover:border-blue-500 hover:bg-gray-600 text-gray-200'
                        : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 text-gray-800'
                        }`}
                    >
                      {(() => {
                        // Extrai motorista do cabeçalho: "LISTA ÔNIBUS 01 - MOTORISTA - UNIV (N VAGAS)"
                        const driverMatch = bus.name.match(/LISTA\s+[ÔO]NIBUS\s+\d+\s*[-–]\s*([^-–]+)\s*[-–]/i);
                        const driver = driverMatch ? driverMatch[1].trim() : '';
                        return (
                          <span className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                            <span className="text-blue-500">ÔNIBUS {String(bus.id).padStart(2, '0')}</span>
                            {driver && <> — <span>{driver.toUpperCase()}</span></>}
                            <span className={`ml-2 font-normal text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>— {bus.students.length} aluno{bus.students.length !== 1 ? 's' : ''}</span>
                          </span>
                        );
                      })()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PASSO 3: Lista de chamada com checkboxes */}
            {selectedChamadaBus && (
              <div>
                {/* Cabeçalho */}
                <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-semibold text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      {(() => {
                        const driverMatch = selectedChamadaBus.name.match(/LISTA\s+[ÔO]NIBUS\s+\d+\s*[-–]\s*([^-–]+)\s*[-–]/i);
                        const driver = driverMatch ? driverMatch[1].trim().toUpperCase() : '';
                        return `ÔNIBUS ${String(selectedChamadaBus.id).padStart(2, '0')}${driver ? ` — ${driver}` : ''} — ${selectedChamadaBus.students.length} aluno${selectedChamadaBus.students.length !== 1 ? 's' : ''}`;
                      })()}
                    </p>
                    <button
                      onClick={copyChamadaList}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md flex-shrink-0 transition-colors ${chamadaCopied
                        ? 'bg-green-500 text-white'
                        : darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      title="Copiar lista da chamada"
                    >
                      {chamadaCopied ? (
                        <><Check className="w-3.5 h-3.5" /> Copiado!</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copiar lista</>
                      )}
                    </button>
                  </div>
                  <div className="flex gap-4 mt-1 text-sm">
                    <span className="text-green-500 font-medium">
                      Presentes: <strong>{selectedChamadaBus.students.filter(s => s.status === 'present').length}</strong>
                    </span>
                    <span className="text-red-400 font-medium">
                      Ausentes: <strong>{selectedChamadaBus.students.filter(s => s.status === 'absent').length}</strong>
                    </span>
                    <span className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                      Pendentes: <strong>{selectedChamadaBus.students.filter(s => s.status === 'pending').length}</strong>
                    </span>
                  </div>
                </div>

                {/* Lista */}
                <ul className="space-y-2">
                  {selectedChamadaBus.students.map((student, index) => (
                    <li key={index} className="relative">
                      {/* Item do aluno */}
                      <div
                        onClick={() => setChamadaPopupIndex(chamadaPopupIndex === index ? null : index)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer select-none transition-all ${student.status === 'present'
                          ? darkMode ? 'bg-green-900/40 border border-green-700' : 'bg-green-50 border border-green-300'
                          : student.status === 'absent'
                            ? darkMode ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-300'
                            : student.status === 'volta'
                              ? darkMode ? 'bg-amber-900/30 border border-amber-700' : 'bg-amber-50 border border-amber-300'
                              : student.status === 'relocated'
                                ? darkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-300'
                                : darkMode ? 'bg-gray-700 border border-gray-600 hover:border-gray-500' : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        {/* Ícone de status */}
                        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-base">
                          {student.status === 'present' && '✅'}
                          {student.status === 'absent' && '❌'}
                          {student.status === 'volta' && '🔙'}
                          {student.status === 'relocated' && '🔄'}
                          {student.status === 'pending' && (
                            <div className={`w-4 h-4 rounded border-2 ${darkMode ? 'border-gray-500' : 'border-gray-400'}`} />
                          )}
                        </div>

                        <span className={`text-sm flex-1 ${student.status === 'present' ? darkMode ? 'text-green-300' : 'text-green-800'
                          : student.status === 'absent' ? darkMode ? 'text-red-300' : 'text-red-700'
                            : student.status === 'volta' ? darkMode ? 'text-amber-300' : 'text-amber-800'
                              : student.status === 'relocated' ? darkMode ? 'text-blue-300' : 'text-blue-800'
                                : darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                          <span className={`mr-2 font-mono text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{index + 1}.</span>
                          <span>{student.name}</span>
                          {student.status === 'relocated' && student.relocatedTo && (
                            <span className={`block text-xs mt-0.5 font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              🔄 REMANEJADO PARA: {student.relocatedTo}
                            </span>
                          )}
                          {student.status === 'relocated' && student.relocatedFrom && (
                            <span className={`block text-xs mt-0.5 font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              🔄 REMANEJADO DE: {student.relocatedFrom}
                            </span>
                          )}
                        </span>
                        {student.school && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500'
                            }`}>{student.school}</span>
                        )}
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>▾</span>
                      </div>

                      {/* Popup de escolha */}
                      {chamadaPopupIndex === index && (
                        <div className={`absolute left-0 right-0 z-10 mt-1 rounded-lg shadow-lg border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                          }`}>
                          <div className="flex">
                            <button
                              onClick={(e) => { e.stopPropagation(); setStudentStatus(index, 'present'); }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium bg-green-500 hover:bg-green-600 text-white transition-colors"
                            >
                              ✅ Presente
                            </button>
                            <div className={`w-px ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`} />
                            <button
                              onClick={(e) => { e.stopPropagation(); setStudentStatus(index, 'absent'); }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                            >
                              ❌ Ausente
                            </button>
                            <div className={`w-px ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`} />
                            <button
                              onClick={(e) => { e.stopPropagation(); setStudentStatus(index, 'volta'); }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                            >
                              🔙 Volta
                            </button>
                            <div className={`w-px ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`} />
                            <button
                              onClick={(e) => { e.stopPropagation(); setChamadaPopupIndex(null); setRelocateModalIndex(index); }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                            >
                              🔄 Remanejado
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                {/* Modal de seleção de ônibus de origem do remanejamento */}
                {relocateModalIndex !== null && (
                  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className={`${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'} rounded-xl shadow-2xl max-w-sm w-full`}>
                      <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <h3 className="font-bold flex items-center gap-2">🔄 Remanejado para qual ônibus?</h3>
                        <button onClick={() => setRelocateModalIndex(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">&times;</button>
                      </div>
                      <div className="p-3 space-y-2">
                        {parsedChamadaBuses
                          .filter(b => b.id !== selectedChamadaBus?.id)
                          .map(bus => {
                            const driverMatch = bus.name.match(/LISTA\s+[ÔO]NIBUS\s+\d+\s*[-–]\s*([^-–]+)\s*[-–]/i);
                            const driver = driverMatch ? driverMatch[1].trim() : `Ônibus ${bus.id}`;
                            return (
                              <button
                                key={bus.id}
                                onClick={() => setStudentRelocated(relocateModalIndex, driver)}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${darkMode ? 'bg-gray-700 hover:bg-blue-800 text-gray-200' : 'bg-gray-50 hover:bg-blue-50 text-gray-700 border border-gray-200 hover:border-blue-300'
                                  }`}
                              >
                                <span className="font-semibold">Ônibus {String(bus.id).padStart(2, '0')} — {driver}</span>
                                <span className={`block text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{bus.students.length} aluno{bus.students.length !== 1 ? 's' : ''}</span>
                              </button>
                            );
                          })}
                        {parsedChamadaBuses.filter(b => b.id !== selectedChamadaBus?.id).length === 0 && (
                          <p className={`text-sm text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nenhum outro ônibus disponível na lista.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal: Trazer aluno remanejado de outro ônibus */}
                {bringModal && (
                  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className={`${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'} rounded-xl shadow-2xl max-w-sm w-full max-h-[80vh] flex flex-col`}>
                      {/* Header */}
                      <div className={`flex items-center justify-between p-4 border-b flex-shrink-0 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <h3 className="font-bold flex items-center gap-2">
                          🔄 {bringModal.step === 'bus' ? 'De qual ônibus?' : 'Selecione o aluno'}
                        </h3>
                        <div className="flex items-center gap-2">
                          {bringModal.step === 'student' && (
                            <button
                              onClick={() => setBringModal({ step: 'bus', sourceBusId: null, search: '' })}
                              className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                              ← Voltar
                            </button>
                          )}
                          <button onClick={() => setBringModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">&times;</button>
                        </div>
                      </div>

                      {/* Passo 1: Seleção de ônibus */}
                      {bringModal.step === 'bus' && (
                        <div className="p-3 space-y-2 overflow-y-auto">
                          {parsedChamadaBuses
                            .filter(b => b.id !== selectedChamadaBus?.id)
                            .map(bus => {
                              const driverMatch = bus.name.match(/LISTA\s+[ÔO]NIBUS\s+\d+\s*[-–]\s*([^-–]+)\s*[-–]/i);
                              const driver = driverMatch ? driverMatch[1].trim() : `Ônibus ${bus.id}`;
                              return (
                                <button
                                  key={bus.id}
                                  onClick={() => setBringModal({ step: 'student', sourceBusId: bus.id, search: '' })}
                                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                                    darkMode ? 'bg-gray-700 hover:bg-blue-800 text-gray-200' : 'bg-gray-50 hover:bg-blue-50 text-gray-700 border border-gray-200 hover:border-blue-300'
                                  }`}
                                >
                                  <span className="font-semibold">Ônibus {String(bus.id).padStart(2, '0')} — {driver}</span>
                                  <span className={`block text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{bus.students.length} aluno{bus.students.length !== 1 ? 's' : ''}</span>
                                </button>
                              );
                            })}
                        </div>
                      )}

                      {/* Passo 2: Busca e seleção de aluno */}
                      {bringModal.step === 'student' && bringModal.sourceBusId !== null && (() => {
                        const sourceBus = parsedChamadaBuses.find(b => b.id === bringModal.sourceBusId)!;
                        const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                        const filtered = sourceBus.students.filter(s => norm(s.name).includes(norm(bringModal.search)));
                        return (
                          <>
                            <div className={`px-3 pt-3 flex-shrink-0`}>
                              <input
                                type="text"
                                placeholder="Buscar aluno..."
                                value={bringModal.search}
                                onChange={e => setBringModal({ ...bringModal, search: e.target.value })}
                                className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? 'bg-gray-700 text-gray-200 border-gray-600 placeholder-gray-500' : 'bg-white text-gray-900 border-gray-300'}`}
                                autoFocus
                              />
                            </div>
                            <div className="p-3 space-y-1.5 overflow-y-auto">
                              {filtered.length === 0 && (
                                <p className={`text-sm text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nenhum aluno encontrado.</p>
                              )}
                              {filtered.map((student, i) => (
                                <button
                                  key={i}
                                  onClick={() => bringStudentFromBus(student, sourceBus)}
                                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                    darkMode ? 'bg-gray-700 hover:bg-green-800 text-gray-200' : 'bg-gray-50 hover:bg-green-50 text-gray-700 border border-gray-200 hover:border-green-300'
                                  }`}
                                >
                                  <span className="font-medium">{student.name}</span>
                                  {student.school && <span className={`ml-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>({student.school})</span>}
                                </button>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Botão voltar (quando múltiplos ônibus) */}
                {parsedChamadaBuses.length > 1 && (
                  <button
                    onClick={() => setSelectedChamadaBus(null)}
                    className={`mt-6 text-sm px-4 py-2 rounded-md transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    ← Voltar para seleção de ônibus
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className={`mt-12 py-6 border-t ${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
        <div className="max-w-4xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <span>
            Desenvolvido por <span className={`font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Ronildo Lima</span>
          </span>

          {/* Links sociais */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/RonildoLima"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 transition-colors ${darkMode ? 'hover:text-white' : 'hover:text-gray-900'}`}
              title="GitHub"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/ronildo-lima-44618b176/"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 transition-colors ${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}
              title="LinkedIn"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>
          </div>

          <span>© 2025 — Direitos reservados para uso não comercial</span>
        </div>
      </footer>
    </div>
  );
}

export default App;