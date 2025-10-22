/**
 * Analyzer.js - Funções de Análise Multivariada
 * Implementação das análises estatísticas
 */

class MultivariateAnalyzer {
    constructor(data) {
        this.rawData = data;
        this.encodedData = null;
        this.columnNames = null;
        this.numericData = null;
        this.correlationMatrix = null;
        this.pcaResults = null;
        this.clusterResults = null;
        
        this.shortColumns = [
            'deficiencia', 'faixa_etaria', 'escolaridade', 'area_atuacao',
            'trabalha_web', 'tempo_funcao', 'usa_wcag', 'apps_acessiveis',
            'sistemas_acessiveis', 'preocupa_acessibilidade', 'implementa_tecnicas',
            'testa_usuarios', 'usa_leitor_tela', 'motivacao_ferramentas',
            'usa_html_semantico', 'conhece_ferramentas_runtime', 'ferramentas_runtime_usa',
            'ferramentas_validacao', 'motivacao_usar_ferramentas'
        ];
    }

    // Codificar dados categóricos para numéricos
    encodeData() {
        const encoded = [];
        const encoders = {};
        
        this.columnNames = Object.keys(this.rawData[0]);
        
        // Para cada coluna, criar um mapeamento único
        this.columnNames.forEach(col => {
            const uniqueValues = [...new Set(this.rawData.map(row => row[col]))];
            encoders[col] = {};
            uniqueValues.forEach((val, idx) => {
                encoders[col][val] = idx;
            });
        });
        
        // Aplicar codificação
        this.rawData.forEach(row => {
            const encodedRow = {};
            this.columnNames.forEach(col => {
                encodedRow[col] = encoders[col][row[col]];
            });
            encoded.push(encodedRow);
        });
        
        this.encodedData = encoded;
        this.numericData = this.toMatrix(encoded);
        return encoded;
    }

    // Converter dados para matriz numérica
    toMatrix(data) {
        return data.map(row => this.columnNames.map(col => row[col]));
    }

    // Normalizar dados (z-score)
    normalizeData(matrix) {
        const means = this.columnMeans(matrix);
        const stds = this.columnStds(matrix, means);
        
        return matrix.map(row => 
            row.map((val, idx) => {
                if (stds[idx] === 0) return 0;
                return (val - means[idx]) / stds[idx];
            })
        );
    }

    // Calcular médias das colunas
    columnMeans(matrix) {
        const n = matrix.length;
        const means = new Array(matrix[0].length).fill(0);
        
        matrix.forEach(row => {
            row.forEach((val, idx) => {
                means[idx] += val / n;
            });
        });
        
        return means;
    }

    // Calcular desvios padrão das colunas
    columnStds(matrix, means) {
        const n = matrix.length;
        const variances = new Array(matrix[0].length).fill(0);
        
        matrix.forEach(row => {
            row.forEach((val, idx) => {
                variances[idx] += Math.pow(val - means[idx], 2) / n;
            });
        });
        
        return variances.map(v => Math.sqrt(v));
    }

    // Análise de Correlação de Spearman
    calculateCorrelationMatrix() {
        const n = this.columnNames.length;
        const matrix = Array(n).fill().map(() => Array(n).fill(0));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    matrix[i][j] = 1;
                } else {
                    const col1 = this.numericData.map(row => row[i]);
                    const col2 = this.numericData.map(row => row[j]);
                    matrix[i][j] = this.spearmanCorrelation(col1, col2);
                }
            }
        }
        
        this.correlationMatrix = matrix;
        return matrix;
    }

    // Correlação de Spearman
    spearmanCorrelation(x, y) {
        const n = x.length;
        const ranksX = this.getRanks(x);
        const ranksY = this.getRanks(y);
        
        let sumDiffSquared = 0;
        for (let i = 0; i < n; i++) {
            sumDiffSquared += Math.pow(ranksX[i] - ranksY[i], 2);
        }
        
        return 1 - (6 * sumDiffSquared) / (n * (Math.pow(n, 2) - 1));
    }

    // Obter ranks para Spearman
    getRanks(arr) {
        const sorted = arr.map((val, idx) => ({ val, idx }))
                          .sort((a, b) => a.val - b.val);
        const ranks = new Array(arr.length);
        
        sorted.forEach((item, rank) => {
            ranks[item.idx] = rank + 1;
        });
        
        return ranks;
    }

    // Top correlações
    getTopCorrelations(n = 15) {
        const correlations = [];
        const cols = this.columnNames.length;
        
        for (let i = 0; i < cols; i++) {
            for (let j = i + 1; j < cols; j++) {
                correlations.push({
                    var1: this.columnNames[i],
                    var2: this.columnNames[j],
                    correlation: this.correlationMatrix[i][j],
                    absCorrelation: Math.abs(this.correlationMatrix[i][j])
                });
            }
        }
        
        return correlations
            .sort((a, b) => b.absCorrelation - a.absCorrelation)
            .slice(0, n);
    }

    // PCA - Análise de Componentes Principais
    performPCA() {
        // Normalizar dados
        const normalized = this.normalizeData(this.numericData);
        
        // Calcular matriz de covariância
        const covMatrix = this.covarianceMatrix(normalized);
        
        // Calcular autovalores e autovetores (aproximação via power iteration)
        const { eigenvalues, eigenvectors } = this.eigenDecomposition(covMatrix, 10);
        
        // Calcular variância explicada
        const totalVariance = eigenvalues.reduce((sum, val) => sum + val, 0);
        const explainedVariance = eigenvalues.map(val => val / totalVariance);
        const cumulativeVariance = [];
        explainedVariance.reduce((sum, val) => {
            const cumSum = sum + val;
            cumulativeVariance.push(cumSum);
            return cumSum;
        }, 0);
        
        // Projetar dados nos componentes principais
        const projectedData = this.projectData(normalized, eigenvectors);
        
        this.pcaResults = {
            eigenvalues,
            eigenvectors,
            explainedVariance,
            cumulativeVariance,
            projectedData,
            loadings: eigenvectors
        };
        
        return this.pcaResults;
    }

    // Matriz de covariância
    covarianceMatrix(matrix) {
        const n = matrix.length;
        const m = matrix[0].length;
        const cov = Array(m).fill().map(() => Array(m).fill(0));
        
        // Calcular médias
        const means = this.columnMeans(matrix);
        
        // Calcular covariância
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < m; j++) {
                let sum = 0;
                for (let k = 0; k < n; k++) {
                    sum += (matrix[k][i] - means[i]) * (matrix[k][j] - means[j]);
                }
                cov[i][j] = sum / (n - 1);
            }
        }
        
        return cov;
    }

    // Decomposição em autovalores (Power Iteration - simplificado)
    eigenDecomposition(matrix, numComponents) {
        const n = matrix.length;
        const eigenvalues = [];
        const eigenvectors = [];
        
        // Aproximação usando método simplificado
        // Para cada componente
        for (let comp = 0; comp < Math.min(numComponents, n); comp++) {
            let vector = Array(n).fill(1 / Math.sqrt(n));
            let eigenvalue = 0;
            
            // Power iteration
            for (let iter = 0; iter < 100; iter++) {
                const newVector = this.matrixVectorMultiply(matrix, vector);
                eigenvalue = this.vectorNorm(newVector);
                vector = newVector.map(v => v / eigenvalue);
            }
            
            eigenvalues.push(Math.abs(eigenvalue));
            eigenvectors.push(vector);
            
            // Deflação para próximo componente
            matrix = this.deflateMatrix(matrix, vector, eigenvalue);
        }
        
        return { eigenvalues, eigenvectors };
    }

    // Multiplicação matriz-vetor
    matrixVectorMultiply(matrix, vector) {
        return matrix.map(row => 
            row.reduce((sum, val, idx) => sum + val * vector[idx], 0)
        );
    }

    // Norma do vetor
    vectorNorm(vector) {
        return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    }

    // Deflação da matriz
    deflateMatrix(matrix, eigenvector, eigenvalue) {
        const n = matrix.length;
        const deflated = Array(n).fill().map(() => Array(n).fill(0));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                deflated[i][j] = matrix[i][j] - eigenvalue * eigenvector[i] * eigenvector[j];
            }
        }
        
        return deflated;
    }

    // Projetar dados
    projectData(data, eigenvectors) {
        return data.map(row => 
            eigenvectors.map(evec => 
                row.reduce((sum, val, idx) => sum + val * evec[idx], 0)
            )
        );
    }

    // K-Means Clustering
    performKMeans(k = 4, maxIterations = 100) {
        const normalized = this.normalizeData(this.numericData);
        
        // Inicializar centroides aleatoriamente (k-means++)
        let centroids = this.initializeCentroidsKMeansPlusPlus(normalized, k);
        let clusters = [];
        let prevClusters = [];
        
        for (let iter = 0; iter < maxIterations; iter++) {
            // Atribuir pontos aos clusters
            clusters = this.assignClusters(normalized, centroids);
            
            // Verificar convergência
            if (this.clustersEqual(clusters, prevClusters)) {
                break;
            }
            
            // Atualizar centroides
            centroids = this.updateCentroids(normalized, clusters, k);
            prevClusters = [...clusters];
        }
        
        // Calcular inércia (WCSS)
        const inertia = this.calculateInertia(normalized, clusters, centroids);
        
        this.clusterResults = {
            clusters,
            centroids,
            k,
            inertia
        };
        
        return this.clusterResults;
    }

    // Inicialização K-Means++ 
    initializeCentroidsKMeansPlusPlus(data, k) {
        const centroids = [];
        const n = data.length;
        
        // Primeiro centroide aleatório
        centroids.push([...data[Math.floor(Math.random() * n)]]);
        
        // Demais centroides
        for (let i = 1; i < k; i++) {
            const distances = data.map(point => {
                const minDist = Math.min(...centroids.map(c => this.euclideanDistance(point, c)));
                return minDist * minDist;
            });
            
            const totalDist = distances.reduce((sum, d) => sum + d, 0);
            const probs = distances.map(d => d / totalDist);
            
            // Selecionar próximo centroide com probabilidade proporcional à distância
            const rand = Math.random();
            let cumProb = 0;
            for (let j = 0; j < n; j++) {
                cumProb += probs[j];
                if (rand <= cumProb) {
                    centroids.push([...data[j]]);
                    break;
                }
            }
        }
        
        return centroids;
    }

    // Atribuir clusters
    assignClusters(data, centroids) {
        return data.map(point => {
            const distances = centroids.map(c => this.euclideanDistance(point, c));
            return distances.indexOf(Math.min(...distances));
        });
    }

    // Atualizar centroides
    updateCentroids(data, clusters, k) {
        const centroids = [];
        
        for (let i = 0; i < k; i++) {
            const clusterPoints = data.filter((_, idx) => clusters[idx] === i);
            if (clusterPoints.length === 0) {
                centroids.push(data[Math.floor(Math.random() * data.length)]);
            } else {
                const dims = clusterPoints[0].length;
                const centroid = Array(dims).fill(0);
                clusterPoints.forEach(point => {
                    point.forEach((val, idx) => {
                        centroid[idx] += val / clusterPoints.length;
                    });
                });
                centroids.push(centroid);
            }
        }
        
        return centroids;
    }

    // Distância euclidiana
    euclideanDistance(p1, p2) {
        return Math.sqrt(p1.reduce((sum, val, idx) => sum + Math.pow(val - p2[idx], 2), 0));
    }

    // Verificar se clusters são iguais
    clustersEqual(c1, c2) {
        if (c1.length !== c2.length) return false;
        return c1.every((val, idx) => val === c2[idx]);
    }

    // Calcular inércia (Within-Cluster Sum of Squares)
    calculateInertia(data, clusters, centroids) {
        return data.reduce((sum, point, idx) => {
            const cluster = clusters[idx];
            const centroid = centroids[cluster];
            return sum + Math.pow(this.euclideanDistance(point, centroid), 2);
        }, 0);
    }

    // Método do cotovelo (calcular inércias para diferentes valores de k)
    elbowMethod(maxK = 10) {
        const inertias = [];
        const normalized = this.normalizeData(this.numericData);
        
        for (let k = 2; k <= maxK; k++) {
            const result = this.performKMeansForK(normalized, k);
            inertias.push({ k, inertia: result.inertia });
        }
        
        return inertias;
    }

    // K-Means para um k específico
    performKMeansForK(data, k) {
        let centroids = this.initializeCentroidsKMeansPlusPlus(data, k);
        let clusters = [];
        
        for (let iter = 0; iter < 50; iter++) {
            clusters = this.assignClusters(data, centroids);
            centroids = this.updateCentroids(data, clusters, k);
        }
        
        const inertia = this.calculateInertia(data, clusters, centroids);
        return { clusters, centroids, inertia };
    }

    // Análise descritiva
    getDescriptiveStats() {
        const stats = {};
        
        this.columnNames.forEach((col, idx) => {
            const values = this.numericData.map(row => row[idx]);
            stats[col] = {
                mean: this.mean(values),
                median: this.median(values),
                std: this.std(values),
                min: Math.min(...values),
                max: Math.max(...values)
            };
        });
        
        return stats;
    }

    mean(arr) {
        return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    }

    median(arr) {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    std(arr) {
        const m = this.mean(arr);
        const variance = arr.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / arr.length;
        return Math.sqrt(variance);
    }

    // Caracterização dos clusters
    characterizeClusters() {
        if (!this.clusterResults) return null;
        
        const profiles = [];
        const k = this.clusterResults.k;
        
        for (let i = 0; i < k; i++) {
            const clusterData = this.rawData.filter((_, idx) => this.clusterResults.clusters[idx] === i);
            const size = clusterData.length;
            const percentage = (size / this.rawData.length * 100).toFixed(1);
            
            // Encontrar valores mais comuns
            const profile = {
                cluster: i,
                size,
                percentage,
                characteristics: {}
            };
            
            // Analisar características principais
            const mainCols = ['usa_wcag', 'apps_acessiveis', 'preocupa_acessibilidade', 
                             'implementa_tecnicas', 'area_atuacao'];
            
            mainCols.forEach(col => {
                if (this.columnNames.includes(col)) {
                    const values = clusterData.map(row => row[col]);
                    const mode = this.mode(values);
                    profile.characteristics[col] = mode;
                }
            });
            
            profiles.push(profile);
        }
        
        return profiles;
    }

    // Moda (valor mais frequente)
    mode(arr) {
        const counts = {};
        arr.forEach(val => counts[val] = (counts[val] || 0) + 1);
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }

    // Frequência de valores
    getFrequencies(columnName) {
        const values = this.rawData.map(row => row[columnName]);
        const counts = {};
        values.forEach(val => counts[val] = (counts[val] || 0) + 1);
        
        return Object.entries(counts)
            .map(([value, count]) => ({ value, count, percentage: (count / values.length * 100).toFixed(1) }))
            .sort((a, b) => b.count - a.count);
    }

    // ========== t-SNE Implementation ==========
    
    // t-SNE - t-Distributed Stochastic Neighbor Embedding
    performTSNE(perplexity = 30, iterations = 1000, learningRate = 200) {
        const normalized = this.normalizeData(this.numericData);
        const n = normalized.length;
        
        // Calcular matriz de probabilidades P (high-dimensional)
        const P = this.computeP(normalized, perplexity);
        
        // Inicializar Y (low-dimensional embedding) aleatoriamente
        let Y = Array(n).fill().map(() => [
            (Math.random() - 0.5) * 0.0001,
            (Math.random() - 0.5) * 0.0001
        ]);
        
        // Gradiente descendente
        let momentum = Array(n).fill().map(() => [0, 0]);
        const momentumFactor = 0.5;
        const finalMomentum = 0.8;
        const momentumSwitch = 250;
        
        for (let iter = 0; iter < iterations; iter++) {
            // Calcular matriz Q (low-dimensional)
            const Q = this.computeQ(Y);
            
            // Calcular gradiente
            const gradient = this.computeTSNEGradient(P, Q, Y);
            
            // Atualizar momentum
            const currentMomentum = iter < momentumSwitch ? momentumFactor : finalMomentum;
            
            // Atualizar posições
            for (let i = 0; i < n; i++) {
                momentum[i][0] = currentMomentum * momentum[i][0] - learningRate * gradient[i][0];
                momentum[i][1] = currentMomentum * momentum[i][1] - learningRate * gradient[i][1];
                Y[i][0] += momentum[i][0];
                Y[i][1] += momentum[i][1];
            }
            
            // Centralizar Y
            const meanY = [
                Y.reduce((sum, p) => sum + p[0], 0) / n,
                Y.reduce((sum, p) => sum + p[1], 0) / n
            ];
            Y = Y.map(p => [p[0] - meanY[0], p[1] - meanY[1]]);
        }
        
        return { Y: Y, perplexity: perplexity, iterations: iterations };
    }

    // Calcular matriz P (high-dimensional probabilities)
    computeP(data, perplexity) {
        const n = data.length;
        const P = Array(n).fill().map(() => Array(n).fill(0));
        const targetEntropy = Math.log(perplexity);
        
        for (let i = 0; i < n; i++) {
            // Binary search para encontrar sigma adequado
            let betaMin = -Infinity;
            let betaMax = Infinity;
            let beta = 1.0;
            
            for (let iter = 0; iter < 50; iter++) {
                // Calcular probabilidades com beta atual
                let sumP = 0;
                const Pi = Array(n).fill(0);
                
                for (let j = 0; j < n; j++) {
                    if (i !== j) {
                        const dist = this.euclideanDistance(data[i], data[j]);
                        Pi[j] = Math.exp(-beta * dist * dist);
                        sumP += Pi[j];
                    }
                }
                
                // Normalizar
                if (sumP > 0) {
                    for (let j = 0; j < n; j++) {
                        Pi[j] /= sumP;
                    }
                }
                
                // Calcular entropia
                let entropy = 0;
                for (let j = 0; j < n; j++) {
                    if (Pi[j] > 1e-10) {
                        entropy -= Pi[j] * Math.log(Pi[j]);
                    }
                }
                
                // Ajustar beta
                const entropyDiff = entropy - targetEntropy;
                if (Math.abs(entropyDiff) < 1e-5) break;
                
                if (entropyDiff > 0) {
                    betaMin = beta;
                    beta = (betaMax === Infinity) ? beta * 2 : (beta + betaMax) / 2;
                } else {
                    betaMax = beta;
                    beta = (betaMin === -Infinity) ? beta / 2 : (beta + betaMin) / 2;
                }
                
                // Atualizar P[i]
                for (let j = 0; j < n; j++) {
                    P[i][j] = Pi[j];
                }
            }
        }
        
        // Simetrizar P
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                P[i][j] = (P[i][j] + P[j][i]) / (2 * n);
                P[i][j] = Math.max(P[i][j], 1e-12);
            }
        }
        
        return P;
    }

    // Calcular matriz Q (low-dimensional probabilities)
    computeQ(Y) {
        const n = Y.length;
        const Q = Array(n).fill().map(() => Array(n).fill(0));
        let sumQ = 0;
        
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const dist = Math.pow(Y[i][0] - Y[j][0], 2) + Math.pow(Y[i][1] - Y[j][1], 2);
                const qij = 1 / (1 + dist);
                Q[i][j] = qij;
                Q[j][i] = qij;
                sumQ += 2 * qij;
            }
        }
        
        // Normalizar
        if (sumQ > 0) {
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    Q[i][j] = Math.max(Q[i][j] / sumQ, 1e-12);
                }
            }
        }
        
        return Q;
    }

    // Calcular gradiente para t-SNE
    computeTSNEGradient(P, Q, Y) {
        const n = Y.length;
        const gradient = Array(n).fill().map(() => [0, 0]);
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    const pq = P[i][j] - Q[i][j];
                    const dist = Math.pow(Y[i][0] - Y[j][0], 2) + Math.pow(Y[i][1] - Y[j][1], 2);
                    const mult = pq / (1 + dist);
                    
                    gradient[i][0] += 4 * mult * (Y[i][0] - Y[j][0]);
                    gradient[i][1] += 4 * mult * (Y[i][1] - Y[j][1]);
                }
            }
        }
        
        return gradient;
    }

    // ========== Hierarchical Clustering (Dendrograma) ==========
    
    // Clustering Hierárquico (Ward's method)
    performHierarchicalClustering() {
        const normalized = this.normalizeData(this.numericData);
        const n = normalized.length;
        
        // Inicializar clusters (cada ponto é um cluster)
        const clusters = normalized.map((point, idx) => ({
            id: idx,
            points: [idx],
            centroid: [...point],
            height: 0
        }));
        
        const merges = [];
        let nextClusterId = n;
        
        // Mesclar clusters até sobrar apenas um
        while (clusters.length > 1) {
            // Encontrar par de clusters mais próximo
            let minDist = Infinity;
            let minI = 0;
            let minJ = 1;
            
            for (let i = 0; i < clusters.length; i++) {
                for (let j = i + 1; j < clusters.length; j++) {
                    const dist = this.wardDistance(clusters[i], clusters[j]);
                    if (dist < minDist) {
                        minDist = dist;
                        minI = i;
                        minJ = j;
                    }
                }
            }
            
            // Mesclar clusters
            const c1 = clusters[minI];
            const c2 = clusters[minJ];
            
            const newCluster = {
                id: nextClusterId++,
                points: [...c1.points, ...c2.points],
                centroid: this.mergeCentroids(c1, c2),
                height: minDist,
                left: c1,
                right: c2
            };
            
            merges.push({
                cluster1: c1.id,
                cluster2: c2.id,
                distance: minDist,
                size: newCluster.points.length
            });
            
            // Remover clusters antigos e adicionar novo
            clusters.splice(Math.max(minI, minJ), 1);
            clusters.splice(Math.min(minI, minJ), 1);
            clusters.push(newCluster);
        }
        
        return {
            dendrogramData: {
                merges,
                rootCluster: clusters[0]
            },
            merges,
            rootCluster: clusters[0]
        };
    }

    // Distância de Ward entre dois clusters
    wardDistance(c1, c2) {
        const n1 = c1.points.length;
        const n2 = c2.points.length;
        const dist = this.euclideanDistance(c1.centroid, c2.centroid);
        return Math.sqrt((2 * n1 * n2) / (n1 + n2)) * dist;
    }

    // Mesclar centroides
    mergeCentroids(c1, c2) {
        const n1 = c1.points.length;
        const n2 = c2.points.length;
        const total = n1 + n2;
        
        return c1.centroid.map((val, idx) => 
            (val * n1 + c2.centroid[idx] * n2) / total
        );
    }

    // Obter estrutura do dendrograma para visualização
    getDendrogramData() {
        if (!this.hierarchicalResults) {
            this.hierarchicalResults = this.performHierarchicalClustering();
        }
        return this.hierarchicalResults;
    }

    // ========== Chi-Quadrado ==========
    
    // Teste Chi-quadrado para duas variáveis categóricas
    chiSquareTest(var1Name, var2Name) {
        // Criar tabela de contingência
        const contingencyTable = {};
        const row1Values = [];
        const row2Values = [];
        
        this.rawData.forEach(row => {
            const val1 = row[var1Name];
            const val2 = row[var2Name];
            
            if (!contingencyTable[val1]) {
                contingencyTable[val1] = {};
                row1Values.push(val1);
            }
            if (!row2Values.includes(val2)) {
                row2Values.push(val2);
            }
            
            contingencyTable[val1][val2] = (contingencyTable[val1][val2] || 0) + 1;
        });
        
        // Calcular totais
        const rowTotals = {};
        const colTotals = {};
        let grandTotal = 0;
        
        row1Values.forEach(r => {
            rowTotals[r] = 0;
            row2Values.forEach(c => {
                const count = contingencyTable[r][c] || 0;
                rowTotals[r] += count;
                colTotals[c] = (colTotals[c] || 0) + count;
                grandTotal += count;
            });
        });
        
        // Calcular chi-quadrado
        let chiSquare = 0;
        const expected = {};
        
        row1Values.forEach(r => {
            expected[r] = {};
            row2Values.forEach(c => {
                const obs = contingencyTable[r][c] || 0;
                const exp = (rowTotals[r] * colTotals[c]) / grandTotal;
                expected[r][c] = exp;
                
                if (exp > 0) {
                    chiSquare += Math.pow(obs - exp, 2) / exp;
                }
            });
        });
        
        // Graus de liberdade
        const df = (row1Values.length - 1) * (row2Values.length - 1);
        
        // P-valor (aproximação)
        const pValue = this.chiSquarePValue(chiSquare, df);
        
        // V de Cramér (medida de associação)
        const n = grandTotal;
        const minDim = Math.min(row1Values.length - 1, row2Values.length - 1);
        const cramerV = minDim > 0 ? Math.sqrt(chiSquare / (n * minDim)) : 0;
        
        return {
            chiSquare,
            df,
            pValue,
            cramerV,
            significant: pValue < 0.05,
            contingencyTable,
            expected,
            rowTotals,
            colTotals,
            grandTotal
        };
    }

    // Aproximação do p-valor para chi-quadrado
    chiSquarePValue(chiSquare, df) {
        // Aproximação usando distribuição normal para df >= 30
        if (df >= 30) {
            const z = Math.sqrt(2 * chiSquare) - Math.sqrt(2 * df - 1);
            return 1 - this.normalCDF(z);
        }
        
        // Para df < 30, usar tabela aproximada
        const criticalValues = {
            1: [3.841, 6.635, 10.828],
            2: [5.991, 9.210, 13.816],
            3: [7.815, 11.345, 16.266],
            4: [9.488, 13.277, 18.467],
            5: [11.070, 15.086, 20.515],
            10: [18.307, 23.209, 29.588],
            15: [24.996, 30.578, 37.697],
            20: [31.410, 37.566, 45.315]
        };
        
        const closestDf = Object.keys(criticalValues)
            .map(Number)
            .reduce((prev, curr) => 
                Math.abs(curr - df) < Math.abs(prev - df) ? curr : prev
            );
        
        const [cv05, cv01, cv001] = criticalValues[closestDf];
        
        if (chiSquare < cv05) return 0.1; // p > 0.05
        if (chiSquare < cv01) return 0.03; // 0.01 < p < 0.05
        if (chiSquare < cv001) return 0.005; // 0.001 < p < 0.01
        return 0.0001; // p < 0.001
    }

    // CDF da distribuição normal padrão
    normalCDF(x) {
        const t = 1 / (1 + 0.2316419 * Math.abs(x));
        const d = 0.3989423 * Math.exp(-x * x / 2);
        const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        return x > 0 ? 1 - prob : prob;
    }

    // Executar testes chi-quadrado para pares importantes
    performChiSquareAnalysis() {
        const pairs = [
            ['7 - Você utiliza as diretrizes do W3C/WCAG no seu trabalho?', '8 - Você acredita que as aplicações desenvolvida por você ou pelo seu time são acessíveis a pessoas com deficiência?'],
            ['10 - Você ou seu time se preocupa com a acessibilidade (para pessoas com deficiência) dos sistemas utilizados ou desenvolvidos? ', '11 - Você ou seu time implementa técnicas de acessibilidade (para pessoas com deficiência) durante a execução do projeto ou depois que o produto/sistema já está desenvolvido?'],
            ['16 - Você conhece ferramentas que analisam a acessibilidade do código em tempo de execução?', '17 - Quais dessas ferramentas (de análise de acessibilidade em tempo de execução) você utiliza em seu trabalho para verificar a acessibilidade da sua aplicação? Escolha uma ou mais opções'],
            ['15 - Você usa HTML Semântico?', '8 - Você acredita que as aplicações desenvolvida por você ou pelo seu time são acessíveis a pessoas com deficiência?'],
            ['6 - Há quanto tempo desenvolve sua função? ', '7 - Você utiliza as diretrizes do W3C/WCAG no seu trabalho?'],
            ['3 - Escolaridade ', '10 - Você ou seu time se preocupa com a acessibilidade (para pessoas com deficiência) dos sistemas utilizados ou desenvolvidos? '],
            ['4 - Área de atuação principal', '10 - Você ou seu time se preocupa com a acessibilidade (para pessoas com deficiência) dos sistemas utilizados ou desenvolvidos? '],
            ['2 - Faixa etária', '8 - Você acredita que as aplicações desenvolvida por você ou pelo seu time são acessíveis a pessoas com deficiência?']
        ];
        
        const results = [];
        
        pairs.forEach(([var1, var2]) => {
            if (this.columnNames.includes(var1) && this.columnNames.includes(var2)) {
                const result = this.chiSquareTest(var1, var2);
                // Usar nomes abreviados para exibição
                const shortVar1 = var1.split(' - ')[1] || var1;
                const shortVar2 = var2.split(' - ')[1] || var2;
                results.push({
                    var1: shortVar1,
                    var2: shortVar2,
                    ...result
                });
            }
        });
        
        return results;
    }
}
