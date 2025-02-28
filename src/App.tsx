/* eslint-disable prefer-const */
import React, { useState } from 'react';
import { PlusCircle, Bus, School as SchoolIcon, List, Copy, Check } from 'lucide-react';
import { School, Student, Bus as BusType } from './types';

function App() {
  const [view, setView] = useState<'input' | 'management'>('input');
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

      // Remove as universidades selecionadas da lista de escolas disponíveis
    setSchools(prev => prev.filter(school => !selectedSchools.includes(school.name)));

    } else {
      alert('Selecione o número correto de alunos da UNIFIP para preencher os assentos.');
    }
  };





  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-end mb-4">
      </div>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2">
          <Bus className="w-8 h-8" />
          Sistema de Gerenciamento de Ônibus
        </h1>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setView('input')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${view === 'input'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            <SchoolIcon className="w-5 h-5" />
            Processar Lista
          </button>
          <button
            onClick={() => setView('management')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${view === 'management'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            <List className="w-5 h-5" />
            Gerenciar Ônibus
          </button>
        </div>

        {view === 'input' ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Processar Lista Completa</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lista Completa
              </label>
              <textarea
                value={fullList}
                onChange={(e) => setFullList(e.target.value)}
                className="w-full p-2 border rounded-md h-96 font-mono"
                placeholder="Cole a lista completa aqui..."
              />
            </div>

            <button
              onClick={handleProcessList}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              Processar Lista
            </button>

            {schools.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Universidades processadas</h3>
                <div className="space-y-4">
                  {schools.map(school => (
                    <div key={school.name} className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">{school.name}</h4>
                      <ul className="list-decimal list-inside text-gray-600">
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
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Criar Novo Ônibus</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Assentos
                </label>
                <input
                  type="number"
                  value={newBusSeats || ''}
                  onChange={(e) => setNewBusSeats(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border rounded-md"
                  min="1"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Motorista
                </label>

                {/* Lista de seleção para escolher o motorista */}
                <select
                  value={selectedDriver}
                  onChange={handleDriverChange}
                  className="w-full p-2 border rounded-md"
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
                    className="w-full mt-2 p-2 border rounded-md"
                    placeholder="Digite o nome do motorista"
                  />
                )}
              </div>



              <div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Selecione as universidades
  </label>
  <div className="space-y-2">
    {schools
      .filter(school => school.name !== 'UNIFIP')  // Filtra para não incluir UNIFIP
      .map(school => (
        <label key={school.name} className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selectedSchools.includes(school.name)}
            onChange={() => toggleSchool(school.name)}
            className="rounded"
          />
          <span>{`${school.name} - ${school.students.length} alunos`}</span>
        </label>
      ))}
  </div>
</div>




              {availableUnifipStudents.length > 0 && (
                <div className="mb-4 p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    Alunos UNIFIP disponíveis: {availableUnifipStudents.length}
                  </p>
                </div>
              )}

              {totalStudents > 0 && (
                <div className="mb-4 p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
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
                  <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl">
                    <h2 className="text-xl font-semibold mb-4">
                      Selecione os alunos da UNIFIP para preencher os assentos restantes ({remainingSeats} vagas restantes)
                    </h2>

                    {/* Lista de alunos com scroll */}
                    <div className="max-h-60 overflow-y-auto mb-6">  {/* Controla o tamanho e rolagem */}
                      <ul className="space-y-3">
                        {availableUnifipStudents.map((student, index) => (
                          <li key={index} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`student-${index}`}
                                checked={selectedUnifipStudents.includes(student)}
                                onChange={() => handleStudentSelection(student)}
                                className="mr-2"
                                disabled={selectedUnifipStudents.length >= remainingSeats && !selectedUnifipStudents.includes(student)}  // Desabilita quando as vagas são preenchidas
                              />
                              <label htmlFor={`student-${index}`} className="text-sm">{student}</label>
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
                        onClick={() => setIsManualBusCreation(false)}
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
                <h2 className="text-xl font-semibold">Copiar lista completa</h2>
                <button
                  onClick={copyAllBusLists} // Chama a função para copiar todos os ônibus
                  className="text-gray-500 hover:text-gray-700 p-2"
                  title="Copiar todas as listas"
                >
                  {copiedBusId === null ? (
                    <Copy className="w-5 h-5" />
                  ) : (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-6">
              {buses.map(bus => (  // Este é o único 'map' necessário
                <div key={bus.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3>{bus.name}</h3> {/* Aqui estamos exibindo o nome do ônibus */}
                    <button
                      onClick={() => copyBusList(bus)}
                      className="text-gray-500 hover:text-gray-700 p-2"
                      title="Copiar lista"
                    >
                      {copiedBusId === bus.id ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {bus.students.map((student, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span>{index + 1}.</span>
                        <span>{student.name}</span>
                        <span className="text-gray-500">({student.school})</span>
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
      </div>
    </div>
  );
}

export default App;