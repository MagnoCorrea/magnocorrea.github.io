/**
 * Visualizations.js - Criação de Gráficos com Chart.js
 */

class DataVisualizer {
    constructor(analyzer) {
        this.analyzer = analyzer;
        this.charts = {};
    }

    // Destruir gráfico existente
    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
        }
    }

    // Gráfico de barras
    createBarChart(canvasId, data, title, horizontal = false) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.charts[canvasId] = new Chart(ctx, {
            type: horizontal ? 'bar' : 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: title,
                    data: data.values,
                    backgroundColor: 'rgba(37, 99, 235, 0.7)',
                    borderColor: 'rgba(37, 99, 235, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: horizontal ? 'y' : 'x',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: title, font: { size: 16 } }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // Gráfico de pizza
    createPieChart(canvasId, data, title) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        'rgba(37, 99, 235, 0.8)',
                        'rgba(124, 58, 237, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(59, 130, 246, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right' },
                    title: { display: true, text: title, font: { size: 16 } }
                }
            }
        });
    }

    // Matriz de correlação (heatmap simplificado)
    createCorrelationMatrix(canvasId, correlationMatrix, labels) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // Mostrar TODAS as variáveis
        const numVars = labels.length;
        
        // Abreviar labels para melhor visualização
        const shortLabels = labels.map(label => {
            // Extrair parte principal após o número
            const parts = label.split(' - ');
            if (parts.length > 1) {
                const mainText = parts[1].trim();
                // Pegar primeiras palavras (max 30 chars)
                return mainText.length > 30 ? mainText.substring(0, 27) + '...' : mainText;
            }
            return label.length > 30 ? label.substring(0, 27) + '...' : label;
        });
        
        // Criar dataset para scatter plot (simula heatmap)
        const dataPoints = [];
        correlationMatrix.forEach((row, i) => {
            row.forEach((val, j) => {
                dataPoints.push({
                    x: j,
                    y: i,
                    r: Math.abs(val) * 15, // Reduzir tamanho das bolhas para melhor visualização
                    correlation: val,
                    fullLabel1: labels[i],
                    fullLabel2: labels[j]
                });
            });
        });
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bubble',
            data: {
                datasets: [{
                    label: 'Correlação',
                    data: dataPoints,
                    backgroundColor: dataPoints.map(p => {
                        const intensity = Math.abs(p.correlation);
                        if (p.correlation > 0) {
                            return `rgba(37, 99, 235, ${intensity})`;
                        } else {
                            return `rgba(239, 68, 68, ${intensity})`;
                        }
                    })
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { 
                        display: true, 
                        text: `Matriz de Correlação (${numVars} Variáveis)`, 
                        font: { size: 16 } 
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const point = context.raw;
                                return [
                                    `${shortLabels[point.y]} × ${shortLabels[point.x]}`,
                                    `Correlação: ${point.correlation.toFixed(3)}`,
                                    point.correlation > 0.5 ? 'Forte positiva' : 
                                    point.correlation < -0.5 ? 'Forte negativa' :
                                    Math.abs(point.correlation) > 0.3 ? 'Moderada' : 'Fraca'
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: -0.5,
                        max: numVars - 0.5,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => {
                                const idx = Math.round(value);
                                return shortLabels[idx] || '';
                            },
                            font: { size: 9 },
                            maxRotation: 90,
                            minRotation: 45
                        }
                    },
                    y: {
                        type: 'linear',
                        min: -0.5,
                        max: numVars - 0.5,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => {
                                const idx = Math.round(value);
                                return shortLabels[idx] || '';
                            },
                            font: { size: 9 }
                        }
                    }
                }
            }
        });
    }

    // Scree Plot (PCA)
    createScreePlot(canvasId, explainedVariance) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const labels = explainedVariance.map((_, i) => `PC${i + 1}`);
        const values = explainedVariance.map(v => (v * 100).toFixed(2));
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.slice(0, 10),
                datasets: [{
                    label: 'Variância Explicada (%)',
                    data: values.slice(0, 10),
                    backgroundColor: 'rgba(124, 58, 237, 0.7)',
                    borderColor: 'rgba(124, 58, 237, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    title: { 
                        display: true, 
                        text: 'Scree Plot - Variância Explicada por Componente', 
                        font: { size: 16 } 
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        title: { display: true, text: 'Variância (%)' }
                    }
                }
            }
        });
    }

    // Variância Acumulada (PCA)
    createCumulativeVariancePlot(canvasId, cumulativeVariance) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const labels = cumulativeVariance.map((_, i) => `PC${i + 1}`);
        const values = cumulativeVariance.map(v => (v * 100).toFixed(2));
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.slice(0, 10),
                datasets: [{
                    label: 'Variância Acumulada (%)',
                    data: values.slice(0, 10),
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Limiar 80%',
                    data: Array(10).fill(80),
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    title: { 
                        display: true, 
                        text: 'Variância Acumulada', 
                        font: { size: 16 } 
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'Variância Acumulada (%)' }
                    }
                }
            }
        });
    }

    // Biplot (PCA)
    createPCABiplot(canvasId, projectedData, loadings, labels) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // Pontos dos dados projetados
        const dataPoints = projectedData.map(point => ({
            x: point[0],
            y: point[1]
        }));
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Observações',
                    data: dataPoints,
                    backgroundColor: 'rgba(37, 99, 235, 0.5)',
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    title: { 
                        display: true, 
                        text: 'Biplot - PC1 vs PC2', 
                        font: { size: 16 } 
                    }
                },
                scales: {
                    x: { 
                        title: { display: true, text: 'PC1' },
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    },
                    y: { 
                        title: { display: true, text: 'PC2' },
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    }
                }
            }
        });
    }

    // Método do Cotovelo
    createElbowPlot(canvasId, elbowData) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const labels = elbowData.map(d => `k=${d.k}`);
        const values = elbowData.map(d => d.inertia.toFixed(2));
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Inércia (WCSS)',
                    data: values,
                    borderColor: 'rgba(245, 158, 11, 1)',
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    borderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    title: { 
                        display: true, 
                        text: 'Método do Cotovelo - Determinação do k Ótimo', 
                        font: { size: 16 } 
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'Número de Clusters (k)' } },
                    y: { 
                        beginAtZero: true,
                        title: { display: true, text: 'Inércia (WCSS)' }
                    }
                }
            }
        });
    }

    // Distribuição dos Clusters
    createClusterDistribution(canvasId, clusters) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // Contar frequência de cada cluster
        const counts = {};
        clusters.forEach(c => counts[c] = (counts[c] || 0) + 1);
        
        const labels = Object.keys(counts).map(k => `Cluster ${k}`);
        const values = Object.values(counts);
        const percentages = values.map(v => ((v / clusters.length) * 100).toFixed(1));
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.map((l, i) => `${l} (${percentages[i]}%)`),
                datasets: [{
                    data: values,
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right' },
                    title: { 
                        display: true, 
                        text: 'Distribuição dos Respondentes por Cluster', 
                        font: { size: 16 } 
                    }
                }
            }
        });
    }

    // Visualização dos Clusters (usando PCA)
    createClusterVisualization(canvasId, projectedData, clusters) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // Agrupar por cluster
        const clusterColors = [
            'rgba(239, 68, 68, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(245, 158, 11, 0.7)'
        ];
        
        const datasets = [];
        const uniqueClusters = [...new Set(clusters)].sort();
        
        uniqueClusters.forEach(cluster => {
            const clusterPoints = projectedData
                .map((point, idx) => ({ x: point[0], y: point[1], cluster: clusters[idx] }))
                .filter(p => p.cluster === cluster);
            
            datasets.push({
                label: `Cluster ${cluster}`,
                data: clusterPoints,
                backgroundColor: clusterColors[cluster] || 'rgba(100, 100, 100, 0.7)',
                pointRadius: 6,
                pointHoverRadius: 8
            });
        });
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'scatter',
            data: { datasets },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true, position: 'top' },
                    title: { 
                        display: true, 
                        text: 'Visualização dos Clusters (Projeção PCA)', 
                        font: { size: 16 } 
                    }
                },
                scales: {
                    x: { 
                        title: { display: true, text: 'PC1' },
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    },
                    y: { 
                        title: { display: true, text: 'PC2' },
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    }
                }
            }
        });
    }

    // Overview Chart
    // Análise Cruzada
    createCrossAnalysis(canvasId, data) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: data.datasets.map((ds, idx) => ({
                    label: ds.label,
                    data: ds.data,
                    backgroundColor: [
                        'rgba(37, 99, 235, 0.7)',
                        'rgba(124, 58, 237, 0.7)',
                        'rgba(16, 185, 129, 0.7)',
                        'rgba(245, 158, 11, 0.7)'
                    ][idx]
                }))
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    title: { 
                        display: true, 
                        text: 'Análise Cruzada: Conhecimento × Implementação', 
                        font: { size: 16 } 
                    }
                },
                scales: {
                    x: { stacked: false },
                    y: { 
                        beginAtZero: true,
                        stacked: false
                    }
                }
            }
        });
    }

    // ========== t-SNE Visualization ==========
    
    // Visualização t-SNE
    createTSNEVisualization(canvasId, tsneData, title = 't-SNE Visualization') {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const dataPoints = tsneData.map(point => ({
            x: point[0],
            y: point[1]
        }));
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Observações',
                    data: dataPoints,
                    backgroundColor: 'rgba(124, 58, 237, 0.6)',
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    title: { 
                        display: true, 
                        text: title, 
                        font: { size: 16 } 
                    }
                },
                scales: {
                    x: { 
                        title: { display: true, text: 't-SNE Dimensão 1' },
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    },
                    y: { 
                        title: { display: true, text: 't-SNE Dimensão 2' },
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    }
                }
            }
        });
    }

    // Visualização t-SNE com clusters coloridos
    createTSNEWithClusters(canvasId, tsneData, clusters) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const clusterColors = [
            'rgba(239, 68, 68, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(245, 158, 11, 0.7)'
        ];
        
        const datasets = [];
        const uniqueClusters = [...new Set(clusters)].sort((a, b) => a - b);
        
        uniqueClusters.forEach(cluster => {
            const clusterPoints = tsneData
                .map((point, idx) => ({ x: point[0], y: point[1], cluster: clusters[idx] }))
                .filter(p => p.cluster === cluster);
            
            datasets.push({
                label: `Cluster ${cluster}`,
                data: clusterPoints,
                backgroundColor: clusterColors[cluster] || 'rgba(100, 100, 100, 0.7)',
                pointRadius: 6,
                pointHoverRadius: 8
            });
        });
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'scatter',
            data: { datasets },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true, position: 'top' },
                    title: { 
                        display: true, 
                        text: 't-SNE Colorido por Clusters K-Means', 
                        font: { size: 16 } 
                    }
                },
                scales: {
                    x: { 
                        title: { display: true, text: 't-SNE Dimensão 1' },
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    },
                    y: { 
                        title: { display: true, text: 't-SNE Dimensão 2' },
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    }
                }
            }
        });
    }

    // ========== Dendrograma ==========
    
    // Criar dendrograma simplificado
    createDendrogram(containerId, dendrogramData) {
        console.log('createDendrogram called with:', dendrogramData);
        
        const container = document.getElementById(containerId);
        container.innerHTML = ''; // Limpar conteúdo anterior
        
        const merges = dendrogramData.merges;
        const rootCluster = dendrogramData.rootCluster;
        console.log('Merges data:', merges);
        
        // Obter largura do container
        const containerWidth = container.offsetWidth || 1200;
        
        // Configurações do gráfico
        const margin = { top: 40, right: 150, bottom: 60, left: 80 };
        const width = Math.max(containerWidth - margin.left - margin.right, 800);
        const height = 1100 - margin.top - margin.bottom;
        
        // Criar SVG com viewBox para responsividade
        const svg = d3.select(`#${containerId}`)
            .append('svg')
            .attr('width', '100%')
            .attr('height', height + margin.top + margin.bottom)
            .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Construir hierarquia a partir dos merges
        const hierarchy = this.buildHierarchyFromMerges(merges);
        
        // Criar layout de cluster (dendrograma)
        const cluster = d3.cluster()
            .size([height, width]);
        
        const root = d3.hierarchy(hierarchy);
        cluster(root);
        
        // Adicionar título
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -20)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#667eea')
            .text('Dendrograma - Clustering Hierárquico (Método de Ward)');
        
        // Desenhar links (linhas)
        svg.selectAll('.link')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d => {
                return `M${d.source.y},${d.source.x}
                        L${d.source.y},${d.target.x}
                        L${d.target.y},${d.target.x}`;
            })
            .style('fill', 'none')
            .style('stroke', '#667eea')
            .style('stroke-width', 2);
        
        // Desenhar nós (pontos)
        const nodes = svg.selectAll('.node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.y},${d.x})`);
        
        // Adicionar círculos nos nós
        nodes.append('circle')
            .attr('r', 5)
            .style('fill', d => d.children ? '#667eea' : '#10b981')
            .style('stroke', '#fff')
            .style('stroke-width', 2);
        
        // Adicionar labels apenas nas folhas (observações individuais)
        nodes.filter(d => !d.children)
            .append('text')
            .attr('dy', 3)
            .attr('x', d => d.y > width * 0.8 ? -8 : 8)
            .attr('text-anchor', d => d.y > width * 0.8 ? 'end' : 'start')
            .style('font-size', '11px')
            .style('fill', '#666')
            .style('font-weight', '500')
            .text((d, i) => `Obs ${d.data.id !== undefined ? d.data.id : i}`);
        
        // Adicionar escala de distância no eixo X
        const maxDistance = d3.max(root.descendants(), d => d.data.distance || 0);
        const xScale = d3.scaleLinear()
            .domain([0, maxDistance])
            .range([0, width]);
        
        const xAxis = d3.axisBottom(xScale)
            .ticks(5)
            .tickFormat(d => d.toFixed(2));
        
        svg.append('g')
            .attr('transform', `translate(0,${height + 10})`)
            .call(xAxis)
            .append('text')
            .attr('x', width / 2)
            .attr('y', 35)
            .attr('fill', '#666')
            .style('font-size', '12px')
            .style('text-anchor', 'middle')
            .text('Distância de Linkage (Ward)');
    }
    
    // Função auxiliar para construir hierarquia a partir dos merges
    buildHierarchyFromMerges(merges) {
        const n = merges.length + 1; // Número de observações originais
        const nodes = new Map();
        
        // Criar nós folha (observações individuais)
        for (let i = 0; i < n; i++) {
            nodes.set(i, { 
                id: i, 
                distance: 0,
                name: `Obs ${i}`
            });
        }
        
        // Processar merges sequencialmente
        merges.forEach((merge, idx) => {
            const newId = n + idx;
            const child1 = nodes.get(merge.cluster1);
            const child2 = nodes.get(merge.cluster2);
            
            const newNode = {
                id: newId,
                distance: merge.distance,
                name: `Cluster ${newId}`,
                children: [child1, child2]
            };
            
            nodes.set(newId, newNode);
        });
        
        // O último nó criado é a raiz
        const lastId = n + merges.length - 1;
        return nodes.get(lastId);
    }

    // Visualização da estrutura hierárquica
    createHierarchyStructure(canvasId, dendrogramData, k = 4) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const merges = dendrogramData.merges;
        
        // Determinar altura de corte para k clusters
        const sortedDistances = [...merges].map(m => m.distance).sort((a, b) => b - a);
        const cutHeight = k > 1 && k <= sortedDistances.length ? sortedDistances[k - 2] : 0;
        
        // Contar clusters em cada nível
        const levels = merges.map((m, idx) => ({
            merge: idx + 1,
            distance: m.distance,
            clustersRemaining: merges.length - idx
        }));
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: levels.slice(-20).map(l => l.merge),
                datasets: [{
                    label: 'Número de Clusters',
                    data: levels.slice(-20).map(l => l.clustersRemaining),
                    backgroundColor: levels.slice(-20).map(l => 
                        l.distance >= cutHeight ? 'rgba(239, 68, 68, 0.7)' : 'rgba(59, 130, 246, 0.7)'
                    ),
                    borderColor: 'rgba(0, 0, 0, 0.2)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    title: { 
                        display: true, 
                        text: `Estrutura Hierárquica (Corte em k=${k})`, 
                        font: { size: 16 } 
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'Merge #' } },
                    y: { 
                        beginAtZero: true,
                        title: { display: true, text: 'Clusters Restantes' }
                    }
                }
            }
        });
    }

    // ========== Chi-Quadrado ==========
    
    // Visualizar resultados Chi-quadrado
    createChiSquareResults(canvasId, chiSquareResults) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const labels = chiSquareResults.map(r => `${r.var1} × ${r.var2}`);
        const chiValues = chiSquareResults.map(r => r.chiSquare);
        const significant = chiSquareResults.map(r => r.significant);
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Estatística χ²',
                    data: chiValues,
                    backgroundColor: significant.map(s => 
                        s ? 'rgba(16, 185, 129, 0.7)' : 'rgba(156, 163, 175, 0.7)'
                    ),
                    borderColor: significant.map(s => 
                        s ? 'rgba(16, 185, 129, 1)' : 'rgba(156, 163, 175, 1)'
                    ),
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: { 
                        display: true, 
                        text: 'Teste Chi-Quadrado - Estatísticas', 
                        font: { size: 16 } 
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const result = chiSquareResults[context.dataIndex];
                                return [
                                    `χ² = ${result.chiSquare.toFixed(2)}`,
                                    `df = ${result.df}`,
                                    `p-valor ≈ ${result.pValue.toFixed(4)}`,
                                    `V de Cramér = ${result.cramerV.toFixed(3)}`,
                                    `Significativo: ${result.significant ? 'SIM' : 'NÃO'}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: { 
                        beginAtZero: true,
                        title: { display: true, text: 'Estatística χ²' }
                    }
                }
            }
        });
    }

    // Visualizar V de Cramér
    createCramerVChart(canvasId, chiSquareResults) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const labels = chiSquareResults.map(r => `${r.var1.substring(0, 15)}... × ${r.var2.substring(0, 15)}...`);
        const cramerValues = chiSquareResults.map(r => r.cramerV);
        
        // Classificar força da associação
        const getStrengthColor = (v) => {
            if (v > 0.5) return 'rgba(239, 68, 68, 0.7)'; // Forte
            if (v > 0.3) return 'rgba(245, 158, 11, 0.7)'; // Moderada
            if (v > 0.1) return 'rgba(59, 130, 246, 0.7)'; // Fraca
            return 'rgba(156, 163, 175, 0.7)'; // Muito fraca
        };
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'V de Cramér',
                    data: cramerValues,
                    backgroundColor: cramerValues.map(v => getStrengthColor(v)),
                    borderColor: 'rgba(0, 0, 0, 0.2)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: { 
                        display: true, 
                        text: 'V de Cramér - Força da Associação', 
                        font: { size: 16 } 
                    },
                    tooltip: {
                        callbacks: {
                            afterLabel: (context) => {
                                const v = context.parsed.x;
                                let strength = 'Muito fraca';
                                if (v > 0.5) strength = 'Forte';
                                else if (v > 0.3) strength = 'Moderada';
                                else if (v > 0.1) strength = 'Fraca';
                                return `Força: ${strength}`;
                            }
                        }
                    }
                },
                scales: {
                    x: { 
                        beginAtZero: true,
                        max: 1,
                        title: { display: true, text: 'V de Cramér (0 = sem associação, 1 = associação perfeita)' }
                    }
                }
            }
        });
    }

    // Heatmap de tabela de contingência
    createContingencyHeatmap(canvasId, chiSquareResult) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const table = chiSquareResult.contingencyTable;
        const row1Values = Object.keys(table);
        const row2Values = Object.keys(table[row1Values[0]]);
        
        // Criar dados para bubble chart (simulando heatmap)
        const dataPoints = [];
        const maxCount = Math.max(...row1Values.flatMap(r => 
            row2Values.map(c => table[r][c] || 0)
        ));
        
        row1Values.forEach((r, i) => {
            row2Values.forEach((c, j) => {
                const count = table[r][c] || 0;
                dataPoints.push({
                    x: j,
                    y: i,
                    r: (count / maxCount) * 30 + 5,
                    count: count,
                    row: r,
                    col: c
                });
            });
        });
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bubble',
            data: {
                datasets: [{
                    label: 'Frequência',
                    data: dataPoints,
                    backgroundColor: dataPoints.map(p => {
                        const intensity = p.count / maxCount;
                        return `rgba(37, 99, 235, ${Math.max(0.2, intensity)})`;
                    })
                }]
            },
            options: {
                responsive: true,
                aspectRatio: 1.5,
                plugins: {
                    legend: { display: false },
                    title: { 
                        display: true, 
                        text: `Tabela de Contingência: ${chiSquareResult.var1} × ${chiSquareResult.var2}`, 
                        font: { size: 14 } 
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const point = context.raw;
                                return [
                                    `${point.row} × ${point.col}`,
                                    `Frequência: ${point.count}`,
                                    `Esperado: ${chiSquareResult.expected[point.row][point.col].toFixed(1)}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: -0.5,
                        max: row2Values.length - 0.5,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => row2Values[Math.round(value)] || ''
                        },
                        title: { display: true, text: chiSquareResult.var2 }
                    },
                    y: {
                        type: 'linear',
                        min: -0.5,
                        max: row1Values.length - 0.5,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => row1Values[Math.round(value)] || ''
                        },
                        title: { display: true, text: chiSquareResult.var1 }
                    }
                }
            }
        });
    }
}
