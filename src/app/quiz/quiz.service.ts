import { Injectable } from '@angular/core';

export interface Question {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

export interface QuizResult {
    question: string;
    userAnswer: number | null;
    correctAnswer: number;
    isCorrect: boolean;
    options: string[];
    explanation?: string;
}

@Injectable({
    providedIn: 'root'
})
export class QuizService {

    getPlacesQuestions(): Question[] {
        return [
            {
                id: 1,
                question: 'Where is Rizal Park located?',
                options: ['Cebu', 'Manila', 'Baguio', 'Davao'],
                correctAnswer: 1,
                explanation: 'Built in the capital city to honor José Rizal where he was executed, symbolizing national freedom and heroism.'
            },
            {
                id: 2,
                question: 'What is another popular name for Rizal Park?',
                options: ['Freedom Park', 'Luneta Park', 'Victory Park', 'Katipunan Park'],
                correctAnswer: 1,
                explanation: 'Called “Luneta” because of its crescent-shaped layout during the Spanish period.'
            },
            {
                id: 3,
                question: 'What does "Intramuros" mean in Spanish?',
                options: ['Inside the river', 'Within the walls', 'House of kings', 'Fortress of freedom'],
                correctAnswer: 1,
                explanation: 'Named for its stone fortifications, it was the walled Spanish administrative center of Manila.'
            },
            {
                id: 4,
                question: 'When was Intramuros built by the Spanish?',
                options: ['1521', '1565', '1571', '1589'],
                correctAnswer: 2,
                explanation: 'Built by Spanish settlers when they established Manila as the capital of the Spanish East Indies.'
            },
            {
                id: 5,
                question: 'When was the original Barasoain Church built?',
                options: ['1521', '1630', '1898', '1946'],
                correctAnswer: 1,
                explanation: 'Constructed during the Spanish period and later became the site of the First Philippine Congress and Constitution.'
            },
            {
                id: 6,
                question: 'Barasoain Church is located in which city?',
                options: ['Manila', 'Malolos', 'Cebu City', 'Davao City'],
                correctAnswer: 1,
                explanation: 'In Bulacan, where the Malolos Congress drafted the 1899 Constitution, establishing the First Philippine Republic.'
            },
            {
                id: 7,
                question: 'Where is Corregidor Island located?',
                options: ['In the Sulu Sea', 'At the entrance of Manila Bay', 'Near Cebu', 'Off the coast of Palawan'],
                correctAnswer: 1,
                explanation: 'Strategically located to guard the bay’s entrance, making it crucial in wartime defense.'
            },
            {
                id: 8,
                question: 'What role did Corregidor Island play during World War II?',
                options: ['It was a major shipping hub', 'It was a key defense point against the Japanese invasion', 'It was a neutral ground for peace talks', 'It was a headquarters for the Japanese military'],
                correctAnswer: 1,
                explanation: 'It served as the last stronghold of Filipino and American forces during the Japanese invasion.'
            },
            {
                id: 9,
                question: 'When did the Battle of Mactan take place?',
                options: ['April 7, 1521', 'April 27, 1521', 'March 15, 1521', 'May 1, 1521'],
                correctAnswer: 1,
                explanation: 'The historic battle when Filipinos resisted Magellan’s landing, symbolizing defiance to colonization.'
            },
            {
                id: 10,
                question: 'Who was the leader of the Spanish fleet that arrived in the Philippines in 1521?',
                options: ['Christopher Columbus', 'Hernán Cortés', 'Ferdinand Magellan', 'Juan de Salcedo'],
                correctAnswer: 2,
                explanation: 'He led the first European expedition to the Philippines under Spain, though he was Portuguese by birth.'
            }
        ];
    }

    getEventsQuestions(): Question[] {
        return [
            {
                id: 1,
                question: 'When was the Declaration of Philippine Independence proclaimed?',
                options: ['June 12, 1898', 'July 4, 1946', 'December 30, 1896', 'August 23, 1896'],
                correctAnswer: 0,
                explanation: 'This date marks when the Philippines officially proclaimed its independence from Spain, led by Emilio Aguinaldo.'
            },
            {
                id: 2,
                question: 'Where was the Philippine independence declared in 1898?',
                options: ['Luneta Park', 'Fort Santiago', 'Kawit, Cavite', 'Malacañang Palace'],
                correctAnswer: 2,
                explanation: 'The declaration took place at Aguinaldo’s home in Kawit, Cavite, where the national flag was first waved and the anthem played.'
            },
            {
                id: 3,
                question: 'Who sewed the Philippine flag that was first unfurled during the declaration?',
                options: ['Teresa Magbanua, Gregoria de Jesus, and Aurora Quezon', 'Marcela Agoncillo, Lorenza Agoncillo, and Delfina Herbosa', 'Trinidad Tecson, Gabriela Silang, and Melchora Aquino', 'Aurora Quezon, Josefa Llanes Escoda, and Rosa Sevilla'],
                correctAnswer: 1,
                explanation: 'Marcela Agoncillo, her daughter Lorenza, and Delfina Herbosa de Natividad sewed the first Philippine flag in Hong Kong as a symbol of the new nation.'
            },
            {
                id: 4,
                question: 'Rajah Humabon led the native warriors during the Battle of Mactan?',
                options: ['Rajah Humabon', 'Ferdinand Magellan', 'Lapu-Lapu', 'Emilio Aguinaldo'],
                correctAnswer: 2,
                explanation: 'He commanded local warriors who fought and defeated Magellan’s men, resisting early colonization attempts.'
            },
            {
                id: 5,
                question: 'What happened to Ferdinand Magellan in the Battle of Mactan?',
                options: ['He converted Lapu-Lapu to Christianity', 'He fled to Cebu', 'He was captured and imprisoned', 'He was killed in combat'],
                correctAnswer: 3,
                explanation: 'During the Battle of Mactan, Magellan was struck and killed by Lapu-Lapu’s warriors, ending his expedition’s success in the Philippines.'
            },
            {
                id: 6,
                question: 'What date was the Battle of Mactan fought?',
                options: ['June 12, 1898', 'December 30, 1896', 'April 27, 1521', 'August 23, 1896'],
                correctAnswer: 2,
                explanation: 'This is the historical date when the first recorded resistance against foreign forces occurred.'
            },
            {
                id: 7,
                question: 'What symbolic act took place during the Cry of Balintawak (Pugad Lawin)?',
                options: ['Signing the Declaration of Independe', 'Tearing of cedulas', 'Singing of the national anthem', 'Burial of Jose Rizal'],
                correctAnswer: 1,
                explanation: 'Bonifacio and his men tore their cedulas to reject Spanish authority and taxation, symbolizing the start of their revolution.'
            },
            {
                id: 8,
                question: 'Who led the gathering in Pugad Lawin in August 1896?',
                options: ['Emilio Aguinaldo', 'Jose Rizal', 'Apolinario Mabini', 'Andres Bonifacio'],
                correctAnswer: 3,
                explanation: 'He gathered his followers in Pugad Lawin, where they pledged to revolt against Spain, beginning the revolution.'
            },
            {
                id: 9,
                question: 'What event took place between February 22 to 25, 1986?',
                options: ['Rizal\'s trial', 'People Power Revolution', 'Declaration of Martial Law', 'Philippine-American War'],
                correctAnswer: 1,
                explanation: 'A peaceful mass protest that removed Ferdinand Marcos from power, restoring democracy without violence.'
            },
            {
                id: 10,
                question: 'Where was Jose Rizal executed on December 30, 1896?',
                options: ['Paco Cemetery', 'Kawit, Cavite', 'Fort Santiago', 'Bagumbayan (now Luneta Park'],
                correctAnswer: 3,
                explanation: 'Rizal was executed there on December 30, 1896, by firing squad — his death inspired national unity and revolution.'
            }
        ];
    }

    getFiguresQuestions(): Question[] {
        return [
            {
                id: 1,
                question: 'Who is known as the "Father of the Philippine Revolution"?',
                options: ['Emilio Aguinaldo', 'Apolinario Mabini', 'Andres Bonifacio', 'Lapu-Lapu'],
                correctAnswer: 2,
                explanation: 'He earned this title because he founded and led the Katipunan, a secret revolutionary group that fought against Spanish rule, sparking the 1896 Philippine Revolution.'
            },
            {
                id: 2,
                question: 'What event did Andres Bonifacio lead in August 1896?',
                options: ['Battle of Mactan', 'Cry of Pugadlawin', 'Declaration of Independence', 'EDSA Revolution'],
                correctAnswer: 1,
                explanation: 'This was when Bonifacio and his men tore their cedulas (residence certificates) as a sign of defiance, marking the start of open rebellion against Spain in August 1896.'
            },
            {
                id: 3,
                question: 'What revolutionary society did Bonifacio co-found in 1892?',
                options: ['La Liga Filipina', 'Katipunan', 'Malolos Congress', 'Reform Movement'],
                correctAnswer: 1,
                explanation: 'Bonifacio co-founded the Kataastaasan, Kagalanggalangang Katipunan ng mga Anak ng Bayan to unite Filipinos and fight for independence through revolution.'
            },
            {
                id: 4,
                question: 'How did Andres Bonifacio die?',
                options: ['Died in battle', 'Executed by Spanish soldiers', 'Captured by Americans', 'Executed under Aguinaldo’s orders'],
                correctAnswer: 3,
                explanation: 'After internal conflict between Bonifacio’s and Aguinaldo’s factions, Bonifacio was tried for treason and executed in 1897 by Aguinaldo’s forces, showing the division among revolutionaries.'
            },
            {
                id: 5,
                question: 'What happened to Ferdinand Magellan in the Battle of Mactan?',
                options: ['Jose Rizal', 'Apolinario Mabini', 'Emilio Aguinaldo', 'Andres Bonifacio'],
                correctAnswer: 2,
                explanation: 'He became the first President of the First Philippine Republic in 1899 after leading revolutionary forces that declared independence from Spain.'
            },
            {
                id: 6,
                question: 'Where did Aguinaldo declare Philippine independence?',
                options: ['Tondo, Manila', 'Luneta Park', 'Kawit, Cavite', 'Malolos, Bulacan'],
                correctAnswer: 2,
                explanation: 'Aguinaldo proclaimed Philippine independence from Spanish rule on June 12, 1898, from his house’s balcony in Kawit, Cavite.'
            },
            {
                id: 7,
                question: 'Who led the Filipino victory at the Battle of Mactan?',
                options: ['Lapu-Lapu', 'Rajah Humabon', 'Emilio Aguinaldo', 'Bonifacio'],
                correctAnswer: 0,
                explanation: 'Lapu-Lapu led the native warriors who resisted Magellan’s landing, defeating the Spanish forces — the first recorded act of Filipino resistance to foreign invasion.'
            },
            {
                id: 8,
                question: 'What date was the Battle of Mactan fought?',
                options: ['June 12, 1898', 'July 23, 1864', 'August 23, 1896', 'April 27, 1521'],
                correctAnswer: 3,
                explanation: 'This marks the day when Lapu-Lapu’s forces killed Ferdinand Magellan, preventing Spanish colonization from starting at that time.'
            },
            {
                id: 9,
                question: 'What disability did Apolinario Mabini suffer from?',
                options: ['Blindness', 'Polio-induced paralysis', 'Deafness', 'Amputation'],
                correctAnswer: 1,
                explanation: 'Mabini was paralyzed from the waist down due to polio but still contributed intellectually to the revolution as Aguinaldo’s adviser.'
            },
            {
                id: 10,
                question: 'What title was given to Apolinario Mabini for his role in the revolution?',
                options: ['Supremo', 'Brains of the Revolution', 'President of the Republic', 'General of the Revolution'],
                correctAnswer: 1,
                explanation: 'He provided strategic guidance and wrote political documents for the revolution, earning him the title Brains of the Revolution for his intellectual leadership.'
            }
        ];
    }

    getPeriodsQuestions(): Question[] {
        return [
            {
                id: 1,
                question: 'Who were among the earliest settlers in the Philippines?',
                options: ['Spaniards', 'Negritos', 'Ilocanos', 'Americans'],
                correctAnswer: 1,
                explanation: 'Archaeological evidence shows Negritos were the first inhabitants, arriving thousands of years before colonization.'
            },
            {
                id: 2,
                question: 'What type of society were the Isneg and Kalinga part of?',
                options: ['Hunter-gatherer', 'Warrior society', 'Maritime traders', 'Wood-Carver'],
                correctAnswer: 1,
                explanation: 'These mountain tribes valued bravery, defended their territories, and engaged in tribal warfare, showing a warrior-based culture.'
            },
            {
                id: 3,
                question: 'What religion became dominant in the Philippines because of Spanish colonization?',
                options: ['Islam', 'Protestantism', 'Catholicism', 'Buddhism'],
                correctAnswer: 2,
                explanation: 'Spanish colonizers introduced and spread Catholicism through missions and churches, making it the major religion still today.'
            },
            {
                id: 4,
                question: 'What economic system did the Spaniards introduce to control land and labor?',
                options: ['Feudalism', 'Communism', 'Encomienda system', 'Capitalism'],
                correctAnswer: 2,
                explanation: 'Spain rewarded loyal subjects with land (encomiendas) and control over native labor, creating a feudal-like system.'
            },
            {
                id: 5,
                question: 'Which country took control of the Philippines after Spain?',
                options: ['Japan', 'American', 'Great Britain', 'Germany'],
                correctAnswer: 1,
                explanation: 'After Spain lost the Spanish-American War (1898), the Philippines was ceded to the U.S., starting American colonization.'
            },
            {
                id: 6,
                question: 'In what year was the Philippine Commonwealth government established?',
                options: ['1935', '1941', '1898', '1945'],
                correctAnswer: 0,
                explanation: 'The Philippine Commonwealth was formed as a transitional government before full independence, with Manuel L. Quezon as president.'
            },
            {
                id: 7,
                question: 'How many years did Japan occupy the Philippines?',
                options: ['2 years', '3 years', '4 years', '5 years'],
                correctAnswer: 1,
                explanation: 'Japan ruled the Philippines from 1942–1945 during WWII, marked by harsh control and suffering for Filipinos.'
            },
            {
                id: 8,
                question: 'What were some atrocities committed by the Japanese against Filipinos?',
                options: ['Free education', 'Free trade agreements', 'Forced labor and abuse of women', 'Agricultural reforms'],
                correctAnswer: 2,
                explanation: 'During occupation, many Filipinos were enslaved or forced into labor; women were turned into “comfort women.”'
            },
            {
                id: 9,
                question: 'When did the Philippines gain full independence from the United States?',
                options: ['June 12, 1898', 'July 4, 1946', 'September 2, 1945', 'August 1, 1946'],
                correctAnswer: 1,
                explanation: 'The U.S. officially recognized Philippine sovereignty after WWII on this date.'
            },
            {
                id: 10,
                question: 'What major event in 1986 ended Ferdinand Marcos dictatorship?',
                options: ['Philippine Revolution', 'Katipunan Uprising', 'EDSA People Power Revolution', 'Battle of Manila'],
                correctAnswer: 2,
                explanation: 'A peaceful uprising that ended Marcos’s authoritarian rule and restored democratic governance.'
            }
        ];
    }

    getQuestionsByCategory(category: string): Question[] {
        switch (category) {
            case 'places':
                return this.getPlacesQuestions();
            case 'events':
                return this.getEventsQuestions();
            case 'periods':
                return this.getPeriodsQuestions();
            case 'figures':
                return this.getFiguresQuestions();
            default:
                return this.getPlacesQuestions(); // Default to places questions
        }
    }

    calculateScore(results: QuizResult[]): { score: number; total: number; percentage: number } {
        const correctAnswers = results.filter(result => result.isCorrect).length;
        const totalQuestions = results.length;
        const percentage = (correctAnswers / totalQuestions) * 100;

        return {
            score: correctAnswers,
            total: totalQuestions,
            percentage: percentage
        };
    }
}