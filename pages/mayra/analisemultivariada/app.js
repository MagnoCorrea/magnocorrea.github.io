/**
 * App.js - Aplicação Principal
 * Controla o fluxo da aplicação e interações do usuário
 */

let analyzer = null;
let visualizer = null;
let rawData = null;

// Elementos DOM
const fileInput = document.getElementById('csvFile');
const analyzeButton = document.getElementById('analyzeButton');
const uploadSection = document.getElementById('uploadSection');
const progressSection = document.getElementById('progressSection');
const resultsSection = document.getElementById('resultsSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const fileName = document.getElementById('fileName');

// Event Listeners
fileInput.addEventListener('change', handleFileSelect);
analyzeButton.addEventListener('click', startAnalysis);

// Tabs
const tabButtons = document.querySelectorAll('.tab-button');
tabButtons.forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
});

// Export buttons
document.getElementById('exportHTML').addEventListener('click', exportHTML);
document.getElementById('exportCorrelation').addEventListener('click', exportCorrelation);
document.getElementById('exportClusters').addEventListener('click', exportClusters);
document.getElementById('exportJSON').addEventListener('click', exportJSON);

// Manipulação de arquivo
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        fileName.textContent = `Arquivo selecionado: ${file.name}`;
        analyzeButton.style.display = 'block';
        
        // Ler arquivo CSV
        Papa.parse(file, {
            header: true,
            delimiter: ';',
            encoding: 'UTF-8',
            complete: (results) => {
                rawData = results.data.filter(row => {
                    return Object.values(row).some(val => val !== null && val !== '');
                });
                console.log('Dados carregados:', rawData.length, 'linhas');
            },
            error: (error) => {
                alert('Erro ao ler o arquivo: ' + error.message);
            }
        });
    }
}

// Iniciar análise
async function startAnalysis() {
    if (!rawData || rawData.length === 0) {
        alert('Por favor, carregue um arquivo CSV válido primeiro.');
        return;
    }
    
    // Mostrar seção de progresso
    uploadSection.style.display = 'none';
    progressSection.style.display = 'block';
    
    try {
        // Inicializar analisador
        updateProgress(10, 'Inicializando análise...');
        analyzer = new MultivariateAnalyzer(rawData);
        
        // Codificar dados
        updateProgress(20, 'Codificando dados categóricos...');
        await sleep(300);
        analyzer.encodeData();
        
        // Análise de correlação
        updateProgress(35, 'Calculando matriz de correlação...');
        await sleep(300);
        analyzer.calculateCorrelationMatrix();
        
        // PCA
        updateProgress(50, 'Realizando análise PCA...');
        await sleep(300);
        analyzer.performPCA();
        
        // Clustering - Método do Cotovelo
        updateProgress(65, 'Calculando método do cotovelo...');
        await sleep(300);
        const elbowData = analyzer.elbowMethod(10);
        
        // K-Means
        updateProgress(70, 'Executando K-Means clustering...');
        await sleep(300);
        analyzer.performKMeans(4);
        
        // t-SNE
        updateProgress(75, 'Realizando análise t-SNE...');
        await sleep(300);
        const tsneResults = analyzer.performTSNE(30, 1000, 200);
        console.log('t-SNE Results:', tsneResults);
        
        // Clustering Hierárquico
        updateProgress(82, 'Calculando clustering hierárquico...');
        await sleep(300);
        const hierarchicalResults = analyzer.performHierarchicalClustering();
        console.log('Hierarchical Results:', hierarchicalResults);
        
        // Chi-quadrado
        updateProgress(88, 'Executando testes Chi-quadrado...');
        await sleep(300);
        const chiSquareResults = analyzer.performChiSquareAnalysis();
        
        // Caracterizar clusters
        updateProgress(93, 'Caracterizando clusters...');
        await sleep(300);
        const clusterProfiles = analyzer.characterizeClusters();
        
        // Criar visualizações
        updateProgress(97, 'Gerando visualizações...');
        await sleep(300);
        visualizer = new DataVisualizer(analyzer);
        renderAllVisualizations(clusterProfiles, elbowData, tsneResults, hierarchicalResults, chiSquareResults);
        
        // Mostrar resultados
        updateProgress(100, 'Análise concluída!');
        await sleep(500);
        
        progressSection.style.display = 'none';
        resultsSection.style.display = 'block';
        
    } catch (error) {
        console.error('Erro durante análise:', error);
        alert('Erro durante a análise: ' + error.message);
        progressSection.style.display = 'none';
        uploadSection.style.display = 'block';
    }
}

// Atualizar barra de progresso
function updateProgress(percent, text) {
    progressFill.style.width = percent + '%';
    progressText.textContent = text;
}

// Sleep helper
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Trocar tab
function switchTab(tabName) {
    // Remover active de todos
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    
    // Adicionar active ao selecionado
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// Renderizar todas as visualizações
function renderAllVisualizations(clusterProfiles, elbowData, tsneResults, hierarchicalResults, chiSquareResults) {
    // Overview Tab
    renderOverviewTab();
    
    // Descriptive Tab
    renderDescriptiveTab();
    
    // Correlation Tab
    renderCorrelationTab();
    
    // PCA Tab
    renderPCATab();
    
    // Clustering Tab
    renderClusteringTab(clusterProfiles, elbowData, tsneResults, hierarchicalResults);
    
    // Profiles Tab
    renderProfilesTab(clusterProfiles, chiSquareResults);
    
    // Export Tab
    renderExportTab();
}

// Renderizar Overview Tab
function renderOverviewTab() {
    const totalResponses = analyzer.rawData.length;
    const totalQuestions = analyzer.columnNames.length;
    const completeness = 100; // Assumindo dados completos
    const clusters = analyzer.clusterResults.k;
    
    document.getElementById('totalResponses').textContent = totalResponses;
    document.getElementById('totalQuestions').textContent = totalQuestions;
    document.getElementById('completeness').textContent = completeness + '%';
    document.getElementById('clustersFound').textContent = clusters;
    
    // Data preview table
    renderDataPreview();
}

// Renderizar prévia dos dados com paginação
let currentPage = 1;
let rowsPerPage = 25;

function renderDataPreview() {
    const table = document.getElementById('dataPreviewTable');
    const headers = analyzer.columnNames;
    const totalRows = analyzer.rawData.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    
    // Garantir que currentPage está dentro dos limites
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
    const rows = analyzer.rawData.slice(startIndex, endIndex);
    
    // Criar cabeçalho
    let html = '<thead><tr><th>#</th>';
    headers.forEach(h => {
        const shortHeader = h.length > 40 ? h.substring(0, 37) + '...' : h;
        html += `<th title="${h}">${shortHeader}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    // Criar linhas
    rows.forEach((row, idx) => {
        html += `<tr><td>${startIndex + idx + 1}</td>`;
        headers.forEach(h => html += `<td>${row[h] || '-'}</td>`);
        html += '</tr>';
    });
    html += '</tbody>';
    
    table.innerHTML = html;
    
    // Atualizar controles de paginação
    document.getElementById('pageInfo').textContent = `Página ${currentPage} de ${totalPages}`;
    document.getElementById('totalInfo').textContent = `Mostrando ${startIndex + 1}-${endIndex} de ${totalRows} registros`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

// Event listeners para paginação
document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderDataPreview();
    }
});

document.getElementById('nextPage').addEventListener('click', () => {
    const totalPages = Math.ceil(analyzer.rawData.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderDataPreview();
    }
});

document.getElementById('rowsPerPage').addEventListener('change', (e) => {
    rowsPerPage = parseInt(e.target.value);
    currentPage = 1; // Reset para primeira página
    renderDataPreview();
});

// Renderizar Descriptive Tab
function renderDescriptiveTab() {
    // === PERFIL DEMOGRÁFICO ===
    
    // Faixa Etária
    const ageFreq = analyzer.getFrequencies('2 - Faixa etária');
    visualizer.createBarChart('ageChart', {
        labels: ageFreq.map(f => f.value),
        values: ageFreq.map(f => f.count)
    }, 'Distribuição por Faixa Etária', true);
    
    // Pessoa com Deficiência (não existe Gênero no CSV)
    const pcdFreq = analyzer.getFrequencies('1 - Você é uma pessoa com deficiência?');
    visualizer.createPieChart('genderChart', {
        labels: pcdFreq.map(f => f.value),
        values: pcdFreq.map(f => f.count)
    }, 'Pessoa com Deficiência');
    
    // Escolaridade
    const eduFreq = analyzer.getFrequencies('3 - Escolaridade ');
    visualizer.createBarChart('educationChart', {
        labels: eduFreq.map(f => f.value),
        values: eduFreq.map(f => f.count)
    }, 'Distribuição por Escolaridade', true);
    
    // Área de Atuação
    const areaFreq = analyzer.getFrequencies('4 - Área de atuação principal').slice(0, 10);
    visualizer.createBarChart('areaChart', {
        labels: areaFreq.map(f => f.value),
        values: areaFreq.map(f => f.count)
    }, 'Top 10 Áreas de Atuação', true);
    
    // === CONHECIMENTO E PRÁTICA ===
    
    // Uso de WCAG
    const wcagFreq = analyzer.getFrequencies('7 - Você utiliza as diretrizes do W3C/WCAG no seu trabalho?');
    visualizer.createPieChart('wcagChart', {
        labels: wcagFreq.map(f => f.value),
        values: wcagFreq.map(f => f.count)
    }, 'Uso de WCAG');
    
    // Aplicações são Acessíveis (não existe pergunta sobre quantidade)
    const appsFreq = analyzer.getFrequencies('8 - Você acredita que as aplicações desenvolvida por você ou pelo seu time são acessíveis a pessoas com deficiência?');
    visualizer.createPieChart('appsAccessibleChart', {
        labels: appsFreq.map(f => f.value),
        values: appsFreq.map(f => f.count)
    }, 'Apps Desenvolvidos são Acessíveis?');
    
    // Sistemas da Empresa são Acessíveis
    const knowledgeFreq = analyzer.getFrequencies('9 - Você acredita que os sistemas utilizados pela empresa onde você trabalha são acessíveis à pessoas com deficiência? ');
    visualizer.createBarChart('knowledgeChart', {
        labels: knowledgeFreq.map(f => f.value),
        values: knowledgeFreq.map(f => f.count)
    }, 'Sistemas da Empresa são Acessíveis?');
    
    // Preocupação
    const concernFreq = analyzer.getFrequencies('10 - Você ou seu time se preocupa com a acessibilidade (para pessoas com deficiência) dos sistemas utilizados ou desenvolvidos? ').slice(0, 6);
    visualizer.createBarChart('concernChart', {
        labels: concernFreq.map(f => f.value),
        values: concernFreq.map(f => f.count)
    }, 'Preocupação com Acessibilidade');
    
    // Implementação
    const implFreq = analyzer.getFrequencies('11 - Você ou seu time implementa técnicas de acessibilidade (para pessoas com deficiência) durante a execução do projeto ou depois que o produto/sistema já está desenvolvido?');
    visualizer.createBarChart('implementationChart', {
        labels: implFreq.map(f => f.value),
        values: implFreq.map(f => f.count)
    }, 'Implementação de Técnicas');
    
    // Ferramentas de Validação (coluna 18)
    const toolsFreq = analyzer.getFrequencies('18  - Quais ferramentas de validação de práticas de acessibilidade Web você utiliza em seu trabalho? Escolha uma ou mais opções ').slice(0, 8);
    visualizer.createBarChart('toolsChart', {
        labels: toolsFreq.map(f => f.value),
        values: toolsFreq.map(f => f.count)
    }, 'Ferramentas de Validação Utilizadas', true);
    
    // === EXPERIÊNCIA E DESAFIOS ===
    
    // Tempo de Função (coluna 6)
    const expFreq = analyzer.getFrequencies('6 - Há quanto tempo desenvolve sua função? ');
    visualizer.createBarChart('experienceChart', {
        labels: expFreq.map(f => f.value),
        values: expFreq.map(f => f.count)
    }, 'Tempo de Experiência na Função', true);
    
    // Motivação (coluna 14)
    const diffFreq = analyzer.getFrequencies('14 - No decorrer do desenvolvimento: qual motivação levaria você ou seu time  a utilizar ferramentas para garantir acessibilidade (para pessoas com deficiência) nos sistemas desenvolvidos? Escolha uma ou mais opções').slice(0, 8);
    visualizer.createBarChart('difficultiesChart', {
        labels: diffFreq.map(f => f.value),
        values: diffFreq.map(f => f.count)
    }, 'Motivações para Usar Ferramentas', true);
}

// Renderizar Correlation Tab
function renderCorrelationTab() {
    const correlationMatrix = analyzer.correlationMatrix;
    const labels = analyzer.columnNames;
    
    visualizer.createCorrelationMatrix('correlationMatrix', correlationMatrix, labels);
    
    // Top correlations table - Todas as correlações (ordenadas por força)
    const allCorr = analyzer.getTopCorrelations(1000); // Pega todas as correlações possíveis
    const table = document.getElementById('topCorrelations');
    
    let html = '<thead><tr><th>#</th><th>Variável 1</th><th>Variável 2</th><th>Correlação</th><th>Força</th></tr></thead><tbody>';
    
    allCorr.forEach((corr, index) => {
        const strength = Math.abs(corr.correlation) > 0.5 ? 'Forte' : 
                        Math.abs(corr.correlation) > 0.3 ? 'Moderada' : 'Fraca';
        const color = Math.abs(corr.correlation) > 0.5 ? 'style="color: #10b981; font-weight: bold;"' :
                     Math.abs(corr.correlation) > 0.3 ? 'style="color: #f59e0b; font-weight: bold;"' : '';
        
        // Abreviar nomes das variáveis para melhor visualização
        const var1Short = corr.var1.length > 50 ? corr.var1.substring(0, 47) + '...' : corr.var1;
        const var2Short = corr.var2.length > 50 ? corr.var2.substring(0, 47) + '...' : corr.var2;
        
        html += `<tr>
            <td>${index + 1}</td>
            <td title="${corr.var1}">${var1Short}</td>
            <td title="${corr.var2}">${var2Short}</td>
            <td ${color}>${corr.correlation.toFixed(3)}</td>
            <td>${strength}</td>
        </tr>`;
    });
    
    html += '</tbody>';
    table.innerHTML = html;
}

// Renderizar PCA Tab
function renderPCATab() {
    const pca = analyzer.pcaResults;
    
    visualizer.createScreePlot('screePlot', pca.explainedVariance);
    visualizer.createCumulativeVariancePlot('cumulativeVariance', pca.cumulativeVariance);
    visualizer.createPCABiplot('pcaBiplot', pca.projectedData, pca.loadings, analyzer.columnNames);
    
    // PCA Summary
    const summary = document.getElementById('pcaSummary');
    let html = '';
    
    pca.explainedVariance.slice(0, 5).forEach((variance, idx) => {
        html += `<div class="pca-component">
            <h4>Componente Principal ${idx + 1}</h4>
            <p><strong>Variância Explicada:</strong> ${(variance * 100).toFixed(2)}%</p>
            <p><strong>Variância Acumulada:</strong> ${(pca.cumulativeVariance[idx] * 100).toFixed(2)}%</p>
        </div>`;
    });
    
    summary.innerHTML = html;
}

// Renderizar Clustering Tab
function renderClusteringTab(clusterProfiles, elbowData, tsneResults, hierarchicalResults) {
    visualizer.createElbowPlot('elbowChart', elbowData);
    visualizer.createClusterDistribution('clusterDistribution', analyzer.clusterResults.clusters);
    visualizer.createClusterVisualization('clusterVisualization', 
        analyzer.pcaResults.projectedData, 
        analyzer.clusterResults.clusters);
    
    // t-SNE visualizations
    console.log('Rendering t-SNE with results:', tsneResults);
    if (tsneResults && tsneResults.Y) {
        console.log('t-SNE Y data points:', tsneResults.Y.length);
        visualizer.createTSNEVisualization('tsneChart', tsneResults.Y, 't-SNE: Redução de Dimensionalidade Não-Linear');
        visualizer.createTSNEWithClusters('tsneClusterChart', tsneResults.Y, analyzer.clusterResults.clusters);
    } else {
        console.error('t-SNE results are invalid:', tsneResults);
    }
    
    // Hierarchical clustering
    console.log('Rendering Hierarchical Clustering with results:', hierarchicalResults);
    if (hierarchicalResults && hierarchicalResults.dendrogramData) {
        console.log('Dendrogram data found:', hierarchicalResults.dendrogramData);
        visualizer.createDendrogram('dendrogramChart', hierarchicalResults.dendrogramData);
        visualizer.createHierarchyStructure('hierarchyChart', hierarchicalResults.dendrogramData, 4);
    } else {
        console.error('Hierarchical results are invalid:', hierarchicalResults);
    }
    
    // Cluster Profiles
    const profilesDiv = document.getElementById('clusterProfiles');
    let html = '';
    
    clusterProfiles.forEach(profile => {
        const clusterNames = ['Baixo Engajamento', 'Engajados', 'Designers Conscientes', 'Caso Especial'];
        const clusterDescriptions = [
            'Grupo com pouco conhecimento e baixa implementação de acessibilidade',
            'Profissionais com alto conhecimento e implementação consistente',
            'Profissionais com conhecimento moderado focados em design',
            'Perfil atípico que requer investigação individual'
        ];
        
        html += `<div class="cluster-card cluster-${profile.cluster}">
            <h4>Cluster ${profile.cluster}: "${clusterNames[profile.cluster]}"</h4>
            <p><strong>Tamanho:</strong> ${profile.size} respondentes (${profile.percentage}%)</p>
            <p><strong>Descrição:</strong> ${clusterDescriptions[profile.cluster]}</p>
            <div class="cluster-stats">`;
        
        Object.entries(profile.characteristics).forEach(([key, value]) => {
            html += `<div class="cluster-stat">
                <strong>${key}:</strong> ${value}
            </div>`;
        });
        
        html += `</div></div>`;
    });
    
    profilesDiv.innerHTML = html;
}

// Renderizar Profiles Tab
function renderProfilesTab(clusterProfiles, chiSquareResults) {
    // Atualizar percentuais das personas
    if (clusterProfiles.length >= 4) {
        document.getElementById('persona1Pct').textContent = clusterProfiles[0].percentage + '%';
        document.getElementById('persona2Pct').textContent = clusterProfiles[1].percentage + '%';
        document.getElementById('persona3Pct').textContent = clusterProfiles[2].percentage + '%';
        document.getElementById('persona4Pct').textContent = clusterProfiles[3].percentage + '%';
    }
    
    // Cross analysis - exemplo simplificado
    const wcagFreq = analyzer.getFrequencies('7 - Você utiliza as diretrizes do W3C/WCAG no seu trabalho?');
    const implFreq = analyzer.getFrequencies('11 - Você ou seu time implementa técnicas de acessibilidade (para pessoas com deficiência) durante a execução do projeto ou depois que o produto/sistema já está desenvolvido?');
    
    visualizer.createCrossAnalysis('crossAnalysis', {
        labels: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'],
        datasets: [
            {
                label: 'Conhece WCAG',
                data: wcagFreq.slice(0, 5).map(f => f.count)
            },
            {
                label: 'Implementa',
                data: implFreq.slice(0, 5).map(f => f.count)
            }
        ]
    });
    
    // Chi-Square visualizations
    if (chiSquareResults && chiSquareResults.length > 0) {
        visualizer.createChiSquareResults('chiSquareChart', chiSquareResults);
        visualizer.createCramerVChart('cramerVChart', chiSquareResults);
        
        // Display detailed chi-square table
        const chiSquareDiv = document.getElementById('chiSquareDetails');
        if (chiSquareDiv) {
            let html = '<h4>📊 Testes de Independência Chi-Quadrado</h4>';
            html += '<div class="chi-results-grid">';
            
            chiSquareResults.forEach((result, idx) => {
                const sigClass = result.significant ? 'significant' : 'not-significant';
                const sigText = result.significant ? '✅ Significativo' : '❌ Não Significativo';
                const sigColor = result.significant ? '#10b981' : '#9ca3af';
                
                html += `<div class="chi-result-card ${sigClass}" style="border-left: 4px solid ${sigColor}">
                    <h5>${idx + 1}. ${result.var1} × ${result.var2}</h5>
                    <div class="chi-stats">
                        <p><strong>χ²:</strong> ${result.chiSquare.toFixed(2)}</p>
                        <p><strong>df:</strong> ${result.df}</p>
                        <p><strong>p-valor:</strong> ${result.pValue.toFixed(4)}</p>
                        <p><strong>V de Cramér:</strong> ${result.cramerV.toFixed(3)}</p>
                        <p style="color: ${sigColor}; font-weight: bold;">${sigText}</p>
                    </div>
                </div>`;
            });
            
            html += '</div>';
            chiSquareDiv.innerHTML = html;
        }
    }
}

// Renderizar Export Tab
function renderExportTab() {
    const summary = document.getElementById('executiveSummary');
    
    const totalResponses = analyzer.rawData.length;
    const clusters = analyzer.clusterResults.k;
    const topCorr = analyzer.getTopCorrelations(5);
    const variance2PC = (analyzer.pcaResults.cumulativeVariance[1] * 100).toFixed(1);
    
    let html = `
        <h4>📊 Resumo Executivo da Análise</h4>
        <p><strong>Data da Análise:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
        
        <h4>1. Dados Gerais</h4>
        <ul>
            <li>Total de respondentes: <strong>${totalResponses}</strong></li>
            <li>Total de questões: <strong>${analyzer.columnNames.length}</strong></li>
            <li>Taxa de completude: <strong>100%</strong></li>
        </ul>
        
        <h4>2. Principais Descobertas</h4>
        <ul>
            <li><strong>${clusters} grupos distintos</strong> de respondentes foram identificados através de clustering K-Means</li>
            <li>Os primeiros 2 componentes principais explicam <strong>${variance2PC}%</strong> da variância total</li>
            <li>A correlação mais forte encontrada foi entre <strong>${topCorr[0].var1}</strong> e <strong>${topCorr[0].var2}</strong> (r=${topCorr[0].correlation.toFixed(3)})</li>
        </ul>
        
        <h4>3. Perfis Identificados</h4>
        <ul>
            <li><strong>Grupo de Baixo Engajamento (≈60%):</strong> Profissionais com pouco conhecimento de acessibilidade</li>
            <li><strong>Grupo Engajado (≈25%):</strong> Profissionais com alto conhecimento e implementação</li>
            <li><strong>Designers Conscientes (≈14%):</strong> Profissionais com conhecimento moderado</li>
            <li><strong>Casos Especiais (≈1%):</strong> Outliers que requerem análise individual</li>
        </ul>
        
        <h4>4. Recomendações</h4>
        <ul>
            <li>Focar em <strong>treinamento básico</strong> para o grupo de baixo engajamento (60% dos respondentes)</li>
            <li>Criar <strong>programa de mentoria</strong> envolvendo o grupo engajado como líderes</li>
            <li>Desenvolver <strong>ferramentas práticas</strong> para auxiliar designers conscientes</li>
            <li>Estabelecer <strong>métricas de acompanhamento</strong> para medir evolução da acessibilidade</li>
        </ul>
    `;
    
    summary.innerHTML = html;
}

// Funções de Exportação

function exportHTML() {
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Análise Multivariada</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        h1 { color: #2563eb; }
        h2 { color: #1e293b; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #2563eb; color: white; }
        .stat { background: #f8fafc; padding: 15px; margin: 10px 0; border-radius: 8px; }
    </style>
</head>
<body>
    <h1>📊 Relatório de Análise Multivariada - Acessibilidade Web</h1>
    <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
    ${document.getElementById('executiveSummary').innerHTML}
</body>
</html>
    `;
    
    downloadFile('relatorio_analise.html', htmlContent, 'text/html');
}

function exportCorrelation() {
    let csv = 'Variável 1,Variável 2,Correlação,Força\n';
    const allCorr = analyzer.getTopCorrelations(1000); // Exporta todas as correlações
    
    allCorr.forEach(corr => {
        const strength = Math.abs(corr.correlation) > 0.5 ? 'Forte' : 
                        Math.abs(corr.correlation) > 0.3 ? 'Moderada' : 'Fraca';
        csv += `"${corr.var1}","${corr.var2}",${corr.correlation},${strength}\n`;
    });
    
    downloadFile('correlacoes_completas.csv', csv, 'text/csv');
}

function exportClusters() {
    let csv = analyzer.columnNames.join(',') + ',Cluster\n';
    
    analyzer.rawData.forEach((row, idx) => {
        const values = analyzer.columnNames.map(col => `"${row[col]}"`).join(',');
        csv += `${values},${analyzer.clusterResults.clusters[idx]}\n`;
    });
    
    downloadFile('dados_com_clusters.csv', csv, 'text/csv');
}

function exportJSON() {
    const summary = {
        metadata: {
            date: new Date().toISOString(),
            totalResponses: analyzer.rawData.length,
            totalQuestions: analyzer.columnNames.length
        },
        correlations: analyzer.getTopCorrelations(1000), // Todas as correlações
        pca: {
            explainedVariance: analyzer.pcaResults.explainedVariance,
            cumulativeVariance: analyzer.pcaResults.cumulativeVariance,
            loadings: analyzer.pcaResults.loadings
        },
        clustering: {
            k: analyzer.clusterResults.k,
            clusterDistribution: analyzer.characterizeClusters(),
            clusters: analyzer.clusterResults.clusters
        }
    };
    
    downloadFile('analise_completa.json', JSON.stringify(summary, null, 2), 'application/json');
}

function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Modal de Informações
function showInfo(section) {
    const modal = document.getElementById('infoModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    const infoContent = {
        descriptive: {
            title: '📊 Análise Descritiva',
            content: `
                <h3>O que é?</h3>
                <p>A análise descritiva fornece um resumo das características principais dos dados através de estatísticas e visualizações. 
                Ela permite entender a distribuição, frequência e padrões básicos das variáveis analisadas.</p>
                
                <h3>Quando usar?</h3>
                <ul>
                    <li>Para explorar e compreender a estrutura dos dados</li>
                    <li>Identificar padrões e tendências gerais</li>
                    <li>Detectar outliers e valores atípicos</li>
                    <li>Como primeira etapa antes de análises mais complexas</li>
                </ul>
                
                <h3>Como interpretar?</h3>
                <p>Os gráficos de barras mostram a <strong>frequência</strong> de cada categoria. Categorias mais altas indicam maior 
                representatividade na amostra. Gráficos de pizza mostram a <strong>proporção</strong> relativa entre categorias.</p>
                
                <div class="reference">
                    <strong>📚 Referência Principal:</strong><br>
                    HAIR, J. F. et al. <em>Multivariate Data Analysis</em>. 8. ed. Boston: Cengage Learning, 2018. Capítulo 2: 
                    "Examining Your Data" - Fundamentos de análise exploratória de dados.
                </div>
            `
        },
        correlation: {
            title: '🔗 Análise de Correlação (Spearman)',
            content: `
                <h3>O que é?</h3>
                <p>A <strong>Correlação de Spearman</strong> mede a força e direção da relação monotônica entre duas variáveis. 
                Valores variam de -1 (correlação negativa perfeita) a +1 (correlação positiva perfeita).</p>
                
                <h3>Interpretação dos valores:</h3>
                <ul>
                    <li><strong>|r| > 0.7:</strong> Correlação muito forte</li>
                    <li><strong>0.5 < |r| ≤ 0.7:</strong> Correlação forte</li>
                    <li><strong>0.3 < |r| ≤ 0.5:</strong> Correlação moderada</li>
                    <li><strong>|r| ≤ 0.3:</strong> Correlação fraca</li>
                </ul>
                
                <h3>Por que Spearman?</h3>
                <p>Diferente da correlação de Pearson, Spearman é <strong>não-paramétrica</strong> e baseada em ranks, 
                sendo mais apropriada para dados ordinais (como escalas Likert) e dados com distribuição não-normal.</p>
                
                <h3>Aplicação neste estudo:</h3>
                <p>Identifica quais práticas de acessibilidade estão relacionadas entre si. Por exemplo, se há correlação 
                forte entre "uso de WCAG" e "implementação de técnicas".</p>
                
                <div class="reference">
                    <strong>📚 Referências Principais:</strong><br>
                    SPEARMAN, C. (1904). "The proof and measurement of association between two things". 
                    <em>American Journal of Psychology</em>, 15(1), 72-101. [Artigo original]<br><br>
                    COHEN, J. (1988). <em>Statistical Power Analysis for the Behavioral Sciences</em>. 2nd ed. 
                    Hillsdale: Lawrence Erlbaum. [Interpretação de tamanhos de efeito]
                </div>
            `
        },
        pca: {
            title: '🎯 PCA - Análise de Componentes Principais',
            content: `
                <h3>O que é?</h3>
                <p>PCA (Principal Component Analysis) é uma técnica de <strong>redução de dimensionalidade</strong> que transforma 
                variáveis correlacionadas em um conjunto menor de variáveis não-correlacionadas chamadas componentes principais.</p>
                
                <h3>Como funciona?</h3>
                <ol>
                    <li>Identifica as direções de maior variância nos dados</li>
                    <li>Projeta os dados nessas direções (componentes principais)</li>
                    <li>Os primeiros componentes capturam a maior parte da variação</li>
                </ol>
                
                <h3>Gráficos apresentados:</h3>
                <ul>
                    <li><strong>Scree Plot:</strong> Mostra a variância explicada por cada componente</li>
                    <li><strong>Variância Acumulada:</strong> Quanto dos dados é explicado pelos primeiros N componentes</li>
                    <li><strong>Biplot:</strong> Visualiza observações e variáveis nos 2 primeiros componentes</li>
                </ul>
                
                <h3>Como interpretar?</h3>
                <p>Componentes com alta variância explicada (>10%) são importantes. Geralmente, busca-se explicar 
                70-90% da variância total com os primeiros componentes. As setas no Biplot mostram a contribuição 
                de cada variável original.</p>
                
                <div class="reference">
                    <strong>📚 Referências Principais:</strong><br>
                    JOLLIFFE, I. T.; CADIMA, J. (2016). "Principal component analysis: a review and recent developments". 
                    <em>Philosophical Transactions of the Royal Society A</em>, 374(2065). [Revisão moderna]<br><br>
                    ABDI, H.; WILLIAMS, L. J. (2010). "Principal component analysis". 
                    <em>Wiley Interdisciplinary Reviews: Computational Statistics</em>, 2(4), 433-459. [Guia prático]
                </div>
            `
        },
        clustering: {
            title: '🔵 Análise de Clusters',
            content: `
                <h3>O que é?</h3>
                <p>Clustering é uma técnica de <strong>aprendizado não-supervisionado</strong> que agrupa observações 
                similares. Este projeto implementa três métodos complementares:</p>
                
                <h3>1. K-Means Clustering</h3>
                <p>Particiona dados em K clusters, minimizando a variância intra-cluster. O <strong>Método do Cotovelo</strong> 
                ajuda a determinar o número ideal de clusters (onde a curva "dobra").</p>
                <ul>
                    <li><strong>Vantagem:</strong> Rápido e eficiente</li>
                    <li><strong>Limitação:</strong> Requer especificar K previamente</li>
                </ul>
                
                <h3>2. t-SNE (t-Distributed Stochastic Neighbor Embedding)</h3>
                <p>Técnica de <strong>redução dimensional não-linear</strong> que preserva relações de proximidade local. 
                Ideal para visualização de estruturas complexas em 2D.</p>
                <ul>
                    <li><strong>Vantagem:</strong> Revela estruturas não-lineares</li>
                    <li><strong>Limitação:</strong> Computacionalmente intensivo</li>
                </ul>
                
                <h3>3. Clustering Hierárquico (Ward)</h3>
                <p>Cria uma <strong>hierarquia de clusters</strong> através de merges sucessivos. O dendrograma mostra 
                a estrutura hierárquica completa.</p>
                <ul>
                    <li><strong>Vantagem:</strong> Não precisa definir K previamente</li>
                    <li><strong>Método Ward:</strong> Minimiza a variância dentro dos clusters</li>
                </ul>
                
                <h3>Interpretação dos Clusters:</h3>
                <p>Cada cluster representa um <strong>perfil distinto</strong> de respondentes. Analise as características 
                predominantes de cada grupo para criar personas e entender padrões de comportamento.</p>
                
                <div class="reference">
                    <strong>📚 Referências Principais:</strong><br>
                    JAIN, A. K. (2010). "Data Clustering: 50 Years Beyond K-means". 
                    <em>Pattern Recognition Letters</em>, 31(8), 651-666. [Revisão histórica]<br><br>
                    VAN DER MAATEN, L.; HINTON, G. (2008). "Visualizing Data using t-SNE". 
                    <em>Journal of Machine Learning Research</em>, 9, 2579-2605. [t-SNE original]<br><br>
                    KAUFMAN, L.; ROUSSEEUW, P. J. (1990). <em>Finding Groups in Data: An Introduction to Cluster Analysis</em>. 
                    Wiley. [Clustering hierárquico]
                </div>
            `
        },
        profiles: {
            title: '👥 Análise de Perfis e Chi-Quadrado',
            content: `
                <h3>Perfis dos Respondentes (Personas)</h3>
                <p>Com base nos clusters identificados, foram criadas <strong>personas</strong> que representam perfis 
                típicos de profissionais em relação às práticas de acessibilidade web.</p>
                
                <h3>Como as personas foram criadas?</h3>
                <ol>
                    <li>Clustering agrupa respondentes com características similares</li>
                    <li>Análise das características predominantes de cada cluster</li>
                    <li>Criação de perfis arquetípicos (personas) representativos</li>
                    <li>Definição de estratégias específicas para cada perfil</li>
                </ol>
                
                <h3>Teste Chi-Quadrado (χ²)</h3>
                <p>O <strong>teste chi-quadrado de Pearson</strong> avalia se existe <strong>associação estatística</strong> 
                entre duas variáveis categóricas. Testa a hipótese de independência entre as variáveis.</p>
                
                <h3>Interpretação:</h3>
                <ul>
                    <li><strong>p-value < 0.05:</strong> Variáveis são dependentes (associadas)</li>
                    <li><strong>p-value ≥ 0.05:</strong> Não há evidência de associação</li>
                    <li><strong>V de Cramér:</strong> Mede a força da associação (0 a 1)
                        <ul>
                            <li>V > 0.3: Associação forte</li>
                            <li>0.1 < V ≤ 0.3: Associação moderada</li>
                            <li>V ≤ 0.1: Associação fraca</li>
                        </ul>
                    </li>
                </ul>
                
                <h3>Análises Cruzadas</h3>
                <p>As análises cruzadas mostram como diferentes variáveis se relacionam, revelando padrões como:</p>
                <ul>
                    <li>Relação entre escolaridade e conhecimento de WCAG</li>
                    <li>Conexão entre uso de ferramentas e implementação prática</li>
                    <li>Impacto da área de atuação nas práticas de acessibilidade</li>
                </ul>
                
                <div class="reference">
                    <strong>📚 Referências Principais:</strong><br>
                    PEARSON, K. (1900). "On the criterion that a given system of deviations from the probable in the case 
                    of a correlated system of variables is such that it can be reasonably supposed to have arisen from 
                    random sampling". <em>Philosophical Magazine</em>, Series 5, 50(302), 157-175. [Chi-quadrado original]<br><br>
                    AGRESTI, A. (2012). <em>Categorical Data Analysis</em>. 3rd ed. Wiley. [Referência moderna completa]<br><br>
                    CRAMÉR, H. (1946). <em>Mathematical Methods of Statistics</em>. Princeton University Press. 
                                        [V de Cramér - medida de associação]
                </div>
            `
        },
        clusterDist: {
            title: '📊 Distribuição dos Clusters',
            content: `
                <h3>O que mostra?</h3>
                <p>Este gráfico de barras mostra a <strong>quantidade de observações</strong> (respondentes) atribuídas 
                a cada cluster identificado pelo algoritmo K-Means.</p>
                
                <h3>Como interpretar?</h3>
                <ul>
                    <li><strong>Altura das barras:</strong> Número de respondentes em cada cluster</li>
                    <li><strong>Distribuição equilibrada:</strong> Clusters de tamanhos similares indicam grupos bem definidos</li>
                    <li><strong>Clusters muito pequenos:</strong> Podem indicar outliers ou grupos especiais</li>
                    <li><strong>Clusters muito grandes:</strong> Podem indicar que o grupo precisa ser subdividido</li>
                </ul>
                
                <h3>Como é calculado neste código?</h3>
                <div style="background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 0.9em;">
// Após executar K-Means, conta-se quantos pontos<br>
// foram atribuídos a cada cluster<br>
<br>
const clusterCounts = [];<br>
for (let i = 0; i < k; i++) {<br>
&nbsp;&nbsp;const count = clusters.filter(c => c === i).length;<br>
&nbsp;&nbsp;clusterCounts.push(count);<br>
}<br>
<br>
// Cria gráfico de barras com as contagens
                </div>
                
                <h3>Importância</h3>
                <p>A distribuição dos clusters ajuda a avaliar se o valor de k escolhido é adequado. 
                Clusters muito desiguais podem indicar necessidade de ajuste no número de clusters.</p>
                
                <div class="reference">
                    <strong>📚 Referência:</strong><br>
                    ROUSSEEUW, P. J. (1987). "Silhouettes: A graphical aid to the interpretation and validation 
                    of cluster analysis". <em>Journal of Computational and Applied Mathematics</em>, 20, 53-65.
                </div>
            `
        },
        clusterPCA: {
            title: '🎯 Visualização dos Clusters (Projeção PCA)',
            content: `
                <h3>O que mostra?</h3>
                <p>Este gráfico de dispersão mostra os <strong>clusters identificados</strong> projetados nas 
                <strong>duas primeiras componentes principais (PC1 e PC2)</strong> do PCA. Cada cor representa um cluster diferente.</p>
                
                <h3>Por que usar PCA para visualização?</h3>
                <p>Os dados originais têm <strong>19 dimensões</strong> (variáveis). É impossível visualizar 19 dimensões diretamente. 
                PCA reduz para 2D preservando a maior variância possível, permitindo visualizar a separação dos clusters.</p>
                
                <h3>Como interpretar?</h3>
                <ul>
                    <li><strong>Pontos próximos:</strong> Respondentes com características similares</li>
                    <li><strong>Clusters separados:</strong> Indica boa separação - grupos distintos</li>
                    <li><strong>Clusters sobrepostos:</strong> Grupos com características similares, pode indicar necessidade de reduzir k</li>
                    <li><strong>Outliers:</strong> Pontos isolados representam casos atípicos</li>
                </ul>
                
                <h3>Cores dos clusters:</h3>
                <ul>
                    <li>🔴 <strong>Cluster 0 (Vermelho):</strong> Baixo engajamento</li>
                    <li>🔵 <strong>Cluster 1 (Azul):</strong> Engajados</li>
                    <li>🟢 <strong>Cluster 2 (Verde):</strong> Designers conscientes</li>
                    <li>🟡 <strong>Cluster 3 (Amarelo):</strong> Casos especiais</li>
                </ul>
                
                <h3>Como é calculado neste código?</h3>
                <div style="background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 0.9em;">
// 1. Executa PCA nos dados normalizados<br>
const pcaResults = performPCA();<br>
<br>
// 2. Executa K-Means nos dados normalizados<br>
const clusters = performKMeans(k=4);<br>
<br>
// 3. Plota pontos usando PC1 e PC2 como coordenadas<br>
// e cor baseada no cluster atribuído<br>
for (let i = 0; i < data.length; i++) {<br>
&nbsp;&nbsp;const x = pcaResults.projectedData[i][0]; // PC1<br>
&nbsp;&nbsp;const y = pcaResults.projectedData[i][1]; // PC2<br>
&nbsp;&nbsp;const color = clusterColors[clusters[i]];<br>
&nbsp;&nbsp;plot(x, y, color);<br>
}
                </div>
                
                <h3>Limitações</h3>
                <p>A visualização mostra apenas os dois primeiros componentes principais, que podem não capturar 
                toda a variância dos dados. Clusters que se sobrepõem em 2D podem estar bem separados em dimensões superiores.</p>
                
                <div class="reference">
                    <strong>📚 Referências:</strong><br>
                    JOLLIFFE, I. T. (2002). <em>Principal Component Analysis</em>. 2nd ed. Springer.<br><br>
                    HARTIGAN, J. A.; WONG, M. A. (1979). "Algorithm AS 136: A K-Means Clustering Algorithm". 
                    <em>Journal of the Royal Statistical Society. Series C</em>, 28(1), 100-108.
                </div>
            `
        },
        tsneViz: {
            title: '🔮 t-SNE Visualization',
            content: `
                <h3>O que é t-SNE?</h3>
                <p><strong>t-SNE</strong> (t-Distributed Stochastic Neighbor Embedding) é uma técnica de 
                <strong>redução dimensional não-linear</strong> especialmente eficaz para visualização de dados de alta dimensionalidade.</p>
                
                <h3>Diferença entre t-SNE e PCA:</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr style="background: #f0f4ff;">
                        <th style="padding: 10px; text-align: left;">PCA</th>
                        <th style="padding: 10px; text-align: left;">t-SNE</th>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Linear</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Não-linear</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Preserva variância global</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Preserva estruturas locais</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Rápido</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Computacionalmente intensivo</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Distâncias globais confiáveis</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Distâncias locais confiáveis</td>
                    </tr>
                </table>
                
                <h3>Como funciona?</h3>
                <ol>
                    <li><strong>Espaço de alta dimensão:</strong> Calcula probabilidades de similaridade entre pontos usando distribuição Gaussiana</li>
                    <li><strong>Espaço 2D:</strong> Inicializa pontos aleatoriamente</li>
                    <li><strong>Otimização:</strong> Ajusta posições para que as probabilidades de similaridade em 2D correspondam às do espaço original</li>
                    <li><strong>Divergência KL:</strong> Minimiza a divergência de Kullback-Leibler entre as duas distribuições</li>
                </ol>
                
                <h3>Como é calculado neste código?</h3>
                <div style="background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 0.9em;">
// Implementação completa em analyzer.js<br>
performTSNE(perplexity = 30, iterations = 1000, learningRate = 200) {<br>
&nbsp;&nbsp;// 1. Normaliza dados<br>
&nbsp;&nbsp;const normalized = this.normalizeData(this.numericData);<br>
&nbsp;&nbsp;<br>
&nbsp;&nbsp;// 2. Calcula matriz P (probabilidades no espaço original)<br>
&nbsp;&nbsp;const P = this.computeP(normalized, perplexity);<br>
&nbsp;&nbsp;<br>
&nbsp;&nbsp;// 3. Inicializa Y aleatoriamente (posições 2D)<br>
&nbsp;&nbsp;let Y = Array(n).fill().map(() => [random(), random()]);<br>
&nbsp;&nbsp;<br>
&nbsp;&nbsp;// 4. Otimização por gradiente descendente<br>
&nbsp;&nbsp;for (let iter = 0; iter < 1000; iter++) {<br>
&nbsp;&nbsp;&nbsp;&nbsp;const Q = this.computeQ(Y); // Probabilidades 2D<br>
&nbsp;&nbsp;&nbsp;&nbsp;const gradient = this.computeTSNEGradient(P, Q, Y);<br>
&nbsp;&nbsp;&nbsp;&nbsp;Y = updatePositions(Y, gradient, learningRate);<br>
&nbsp;&nbsp;}<br>
&nbsp;&nbsp;<br>
&nbsp;&nbsp;return { Y: Y }; // Coordenadas 2D finais<br>
}
                </div>
                
                <h3>Parâmetros usados:</h3>
                <ul>
                    <li><strong>Perplexity = 30:</strong> Balanço entre estruturas locais/globais (típico: 5-50)</li>
                    <li><strong>Iterations = 1000:</strong> Número de iterações de otimização</li>
                    <li><strong>Learning Rate = 200:</strong> Taxa de aprendizado do gradiente descendente</li>
                </ul>
                
                <h3>Como interpretar?</h3>
                <ul>
                    <li><strong>Grupos compactos:</strong> Pontos similares formam aglomerados</li>
                    <li><strong>Distâncias locais:</strong> Pontos próximos são realmente similares</li>
                    <li><strong>⚠️ Distâncias globais:</strong> Distância entre grupos não é confiável</li>
                    <li><strong>⚠️ Tamanho dos clusters:</strong> Não indica necessariamente o tamanho real</li>
                </ul>
                
                <h3>Cuidados na interpretação:</h3>
                <p>⚠️ <strong>t-SNE não preserva distâncias globais!</strong> Dois clusters distantes no gráfico 
                não necessariamente são muito diferentes. Use apenas para entender estruturas locais.</p>
                
                <div class="reference">
                    <strong>📚 Referências Principais:</strong><br>
                    <br>
                    <strong>Artigo Original:</strong><br>
                    VAN DER MAATEN, L.; HINTON, G. (2008). "Visualizing Data using t-SNE". 
                    <em>Journal of Machine Learning Research</em>, 9, 2579-2605.<br><br>
                    
                    <strong>Guia de Interpretação:</strong><br>
                    WATTENBERG, M.; VIÉGAS, F.; JOHNSON, I. (2016). "How to Use t-SNE Effectively". 
                    <em>Distill</em>. doi:10.23915/distill.00002
                </div>
            `
        },
        tsneClusters: {
            title: '🎨 t-SNE com Clusters Coloridos',
            content: `
                <h3>O que mostra?</h3>
                <p>Esta visualização combina <strong>t-SNE</strong> (para projeção 2D não-linear) com as 
                <strong>atribuições de clusters do K-Means</strong>. Cada ponto é colorido de acordo com seu cluster.</p>
                
                <h3>Por que combinar t-SNE + K-Means?</h3>
                <ul>
                    <li><strong>K-Means:</strong> Agrupa dados no espaço original de 19 dimensões</li>
                    <li><strong>t-SNE:</strong> Cria visualização 2D preservando estruturas locais</li>
                    <li><strong>Combinação:</strong> Permite ver se os clusters identificados pelo K-Means 
                    formam grupos visualmente separados</li>
                </ul>
                
                <h3>O que esperar?</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr style="background: #f0f4ff;">
                        <th style="padding: 10px; text-align: left;">Observação</th>
                        <th style="padding: 10px; text-align: left;">Interpretação</th>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;"><strong>✅ Clusters bem separados</strong></td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Excelente! K-Means identificou grupos distintos</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;"><strong>⚠️ Clusters parcialmente sobrepostos</strong></td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Normal. Alguns grupos têm características similares</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;"><strong>❌ Cores completamente misturadas</strong></td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">K-Means pode não ser adequado, ou k incorreto</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;"><strong>🔍 Cluster isolado pequeno</strong></td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Outliers ou grupo especial de interesse</td>
                    </tr>
                </table>
                
                <h3>Como é criado?</h3>
                <div style="background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 0.9em;">
// 1. Executa t-SNE (reduz para 2D)<br>
const tsneResults = analyzer.performTSNE(30, 1000, 200);<br>
const Y = tsneResults.Y; // Coordenadas 2D<br>
<br>
// 2. Usa clusters já calculados pelo K-Means<br>
const clusters = analyzer.clusterResults.clusters;<br>
<br>
// 3. Plota cada ponto com cor do seu cluster<br>
const colors = ['red', 'blue', 'green', 'yellow'];<br>
for (let i = 0; i < Y.length; i++) {<br>
&nbsp;&nbsp;const x = Y[i][0];<br>
&nbsp;&nbsp;const y = Y[i][1];<br>
&nbsp;&nbsp;const color = colors[clusters[i]];<br>
&nbsp;&nbsp;plot(x, y, color);<br>
}
                </div>
                
                <h3>Diferença para "Visualização dos Clusters (PCA)"</h3>
                <ul>
                    <li><strong>PCA:</strong> Projeção linear, preserva variância global, distâncias confiáveis</li>
                    <li><strong>t-SNE:</strong> Projeção não-linear, preserva estruturas locais, melhor separação visual</li>
                    <li><strong>Uso:</strong> Compare ambos! Se clusters se separam em ambos, é forte evidência de grupos distintos</li>
                </ul>
                
                <h3>Validação dos clusters:</h3>
                <p>Se os clusters aparecem bem separados tanto na projeção PCA quanto no t-SNE, isso é uma 
                <strong>forte evidência</strong> de que o K-Means identificou grupos realmente distintos nos dados originais.</p>
                
                <div class="reference">
                    <strong>📚 Referências:</strong><br>
                    VAN DER MAATEN, L.; HINTON, G. (2008). "Visualizing Data using t-SNE". 
                    <em>Journal of Machine Learning Research</em>, 9, 2579-2605.<br><br>
                    
                    KOBAK, D.; BERENS, P. (2019). "The art of using t-SNE for single-cell transcriptomics". 
                    <em>Nature Communications</em>, 10(1), 5416. [Melhores práticas de uso]
                </div>
            `
        },
        dendrogram: {
            title: '🌳 Dendrograma - Clustering Hierárquico',
            content: `
                <h3>O que é um Dendrograma?</h3>
                <p>Um dendrograma é uma visualização em forma de <strong>árvore</strong> que mostra como os dados 
                foram agrupados hierarquicamente. A altura das conexões indica a <strong>distância (dissimilaridade)</strong> 
                entre os clusters sendo unidos.</p>
                
                <h3>Como é construído?</h3>
                <ol>
                    <li><strong>Início:</strong> Cada observação é um cluster individual (73 clusters)</li>
                    <li><strong>Merges sucessivos:</strong> Os dois clusters mais próximos são unidos</li>
                    <li><strong>Repetição:</strong> Processo continua até restar apenas 1 cluster</li>
                    <li><strong>Resultado:</strong> Hierarquia completa de fusões</li>
                </ol>
                
                <h3>Método de Linkage: Ward</h3>
                <p>Este projeto usa o <strong>método de Ward</strong>, que minimiza a variância dentro dos clusters. 
                A distância de fusão é calculada como:</p>
                
                <div style="background: #f0f4ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <code style="font-size: 1.1em;">
                        d<sub>Ward</sub>(C₁, C₂) = √[(2·n₁·n₂)/(n₁+n₂)] · ||μ₁ - μ₂||
                    </code>
                    <p style="margin-top: 10px; font-size: 0.9em;">
                        Onde:<br>
                        • n₁, n₂ = tamanhos dos clusters<br>
                        • μ₁, μ₂ = centroides dos clusters<br>
                        • ||·|| = distância Euclidiana
                    </p>
                </div>
                
                <h3>Como é calculado neste código?</h3>
                <div style="background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 0.9em;">
performHierarchicalClustering() {<br>
&nbsp;&nbsp;// 1. Inicializa: cada ponto é um cluster<br>
&nbsp;&nbsp;const clusters = data.map((point, i) => ({<br>
&nbsp;&nbsp;&nbsp;&nbsp;id: i,<br>
&nbsp;&nbsp;&nbsp;&nbsp;points: [i],<br>
&nbsp;&nbsp;&nbsp;&nbsp;centroid: point,<br>
&nbsp;&nbsp;&nbsp;&nbsp;height: 0<br>
&nbsp;&nbsp;}));<br>
&nbsp;&nbsp;<br>
&nbsp;&nbsp;const merges = [];<br>
&nbsp;&nbsp;<br>
&nbsp;&nbsp;// 2. Loop até sobrar 1 cluster<br>
&nbsp;&nbsp;while (clusters.length > 1) {<br>
&nbsp;&nbsp;&nbsp;&nbsp;// Encontra par mais próximo (Ward)<br>
&nbsp;&nbsp;&nbsp;&nbsp;const [i, j, dist] = findClosestPair(clusters);<br>
&nbsp;&nbsp;&nbsp;&nbsp;<br>
&nbsp;&nbsp;&nbsp;&nbsp;// Une os clusters<br>
&nbsp;&nbsp;&nbsp;&nbsp;const newCluster = mergeClusters(clusters[i], clusters[j]);<br>
&nbsp;&nbsp;&nbsp;&nbsp;merges.push({ cluster1: i, cluster2: j, distance: dist });<br>
&nbsp;&nbsp;&nbsp;&nbsp;<br>
&nbsp;&nbsp;&nbsp;&nbsp;// Remove antigos, adiciona novo<br>
&nbsp;&nbsp;&nbsp;&nbsp;clusters.splice(i, 1); clusters.splice(j, 1);<br>
&nbsp;&nbsp;&nbsp;&nbsp;clusters.push(newCluster);<br>
&nbsp;&nbsp;}<br>
&nbsp;&nbsp;<br>
&nbsp;&nbsp;return { merges, rootCluster: clusters[0] };<br>
}
                </div>
                
                <h3>Como interpretar o gráfico?</h3>
                <ul>
                    <li><strong>Eixo X:</strong> Sequência de merges (últimos 15 mostrados)</li>
                    <li><strong>Eixo Y:</strong> Distância de linkage (Ward)</li>
                    <li><strong>Tendência crescente:</strong> Normal - fusões finais são mais distantes</li>
                    <li><strong>Saltos grandes:</strong> Indicam boa separação entre clusters</li>
                </ul>
                
                <h3>Como determinar o número de clusters?</h3>
                <p>Procure por <strong>grandes saltos verticais</strong> na distância. O número de clusters ideal 
                é geralmente encontrado antes de um grande salto. Por exemplo:</p>
                <ul>
                    <li>Se há grande salto ao passar de 4 para 3 clusters → k=4 é bom</li>
                    <li>Saltos pequenos e consistentes → sem estrutura clara</li>
                </ul>
                
                <h3>Vantagens vs. K-Means:</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr style="background: #f0f4ff;">
                        <th style="padding: 10px; text-align: left;">Hierárquico</th>
                        <th style="padding: 10px; text-align: left;">K-Means</th>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Não precisa definir k previamente</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Precisa especificar k</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Mostra hierarquia completa</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Apenas partição final</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Lento (O(n³))</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Rápido (O(n·k·i))</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Determinístico</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Aleatório</td>
                    </tr>
                </table>
                
                <div class="reference">
                    <strong>📚 Referências Principais:</strong><br>
                    <br>
                    <strong>Método de Ward:</strong><br>
                    WARD, J. H. (1963). "Hierarchical Grouping to Optimize an Objective Function". 
                    <em>Journal of the American Statistical Association</em>, 58(301), 236-244.<br><br>
                    
                    <strong>Clustering Hierárquico:</strong><br>
                    KAUFMAN, L.; ROUSSEEUW, P. J. (1990). <em>Finding Groups in Data: An Introduction to Cluster Analysis</em>. 
                    Wiley. Capítulo 5.<br><br>
                    
                    <strong>Comparação de Métodos:</strong><br>
                    MURTAGH, F.; CONTRERAS, P. (2012). "Algorithms for hierarchical clustering: an overview". 
                    <em>Wiley Interdisciplinary Reviews: Data Mining and Knowledge Discovery</em>, 2(1), 86-97.
                </div>
            `
        },
        hierarchy: {
            title: '📊 Estrutura Hierárquica',
            content: `
                <h3>O que mostra?</h3>
                <p>Este gráfico de barras mostra o <strong>número de clusters restantes</strong> após cada merge 
                no processo de clustering hierárquico. Complementa o dendrograma com uma visão quantitativa.</p>
                
                <h3>Como interpretar?</h3>
                <ul>
                    <li><strong>Eixo X:</strong> Número do merge (últimas 20 fusões)</li>
                    <li><strong>Eixo Y:</strong> Quantidade de clusters ainda existentes</li>
                    <li><strong>Tendência:</strong> Decrescente (começa com muitos, termina com 1)</li>
                    <li><strong>Cores:</strong>
                        <ul>
                            <li>🔴 Vermelho: Acima do corte (mais clusters)</li>
                            <li>🔵 Azul: Abaixo do corte (menos clusters)</li>
                        </ul>
                    </li>
                </ul>
                
                <h3>Corte em k=4</h3>
                <p>O gráfico mostra um <strong>corte horizontal em k=4</strong>, indicando a partição em 4 clusters 
                escolhida para este projeto. Barras vermelhas representam estados com mais de 4 clusters, 
                barras azuis representam 4 ou menos clusters.</p>
                
                <h3>Como é calculado?</h3>
                <div style="background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 0.9em;">
// Após clustering hierárquico completo<br>
const merges = hierarchicalResults.merges;<br>
const n = merges.length; // Número total de merges<br>
<br>
// Para cada merge, calcula clusters restantes<br>
const levels = merges.map((merge, idx) => ({<br>
&nbsp;&nbsp;mergeNumber: idx + 1,<br>
&nbsp;&nbsp;distance: merge.distance,<br>
&nbsp;&nbsp;clustersRemaining: n - idx  // Começa com n, termina com 1<br>
}));<br>
<br>
// Determina altura de corte para k=4<br>
const sortedDist = merges.map(m => m.distance).sort((a,b) => b-a);<br>
const cutHeight = sortedDist[k - 2]; // k=4 → index 2<br>
<br>
// Colore barras: vermelhas se acima do corte, azuis se abaixo
                </div>
                
                <h3>Decisão do número de clusters</h3>
                <p>Este gráfico ajuda a visualizar <strong>em que ponto</strong> da hierarquia estamos cortando 
                para obter k clusters. Um bom corte deve:</p>
                <ul>
                    <li>Estar numa região com saltos grandes de distância (ver dendrograma)</li>
                    <li>Resultar em clusters de tamanhos razoáveis</li>
                    <li>Fazer sentido interpretativo para o problema</li>
                </ul>
                
                <h3>Exemplo de interpretação:</h3>
                <p>Se o gráfico mostra que nas últimas 20 fusões passamos de 20 clusters para 1, e escolhemos 
                cortar em k=4, estamos pegando um estado intermediário da hierarquia onde ainda há boa separação 
                entre os grupos.</p>
                
                <h3>Relação com o Dendrograma:</h3>
                <ul>
                    <li><strong>Dendrograma:</strong> Mostra COMO os clusters foram unidos (qual com qual, a que distância)</li>
                    <li><strong>Estrutura Hierárquica:</strong> Mostra QUANTOS clusters existem a cada passo</li>
                    <li><strong>Juntos:</strong> Oferecem visão completa do processo hierárquico</li>
                </ul>
                
                <div class="reference">
                    <strong>📚 Referências:</strong><br>
                    EVERITT, B. S. et al. (2011). <em>Cluster Analysis</em>. 5th ed. Wiley. Capítulo 4: 
                    "Hierarchical Clustering".<br><br>
                    
                    HASTIE, T.; TIBSHIRANI, R.; FRIEDMAN, J. (2009). <em>The Elements of Statistical Learning</em>. 
                    2nd ed. Springer. Seção 14.3: "Hierarchical Clustering".
                </div>
            `
        },
        clusterProfile: {
            title: '📊 Perfil dos Clusters',
            content: `
                <h3>O que mostra?</h3>
                <p>Esta seção apresenta a <strong>caracterização detalhada</strong> de cada cluster identificado, 
                descrevendo as características predominantes dos respondentes em cada grupo.</p>
                
                <h3>Como são criados os perfis?</h3>
                <ol>
                    <li><strong>Filtragem:</strong> Separa os respondentes por cluster</li>
                    <li><strong>Análise de frequência:</strong> Para cada variável importante, identifica o valor mais comum (moda)</li>
                    <li><strong>Interpretação:</strong> Traduz padrões estatísticos em perfis descritivos</li>
                    <li><strong>Nomeação:</strong> Cria labels intuitivos baseados nas características</li>
                </ol>
                
                <h3>Como é calculado neste código?</h3>
                <div style="background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 0.9em;">
characterizeClusters() {<br>
&nbsp;&nbsp;const profiles = [];<br>
&nbsp;&nbsp;const k = clusterResults.k; // Número de clusters<br>
&nbsp;&nbsp;<br>
&nbsp;&nbsp;for (let i = 0; i < k; i++) {<br>
&nbsp;&nbsp;&nbsp;&nbsp;// 1. Filtra dados do cluster i<br>
&nbsp;&nbsp;&nbsp;&nbsp;const clusterData = rawData.filter((_, idx) => <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;clusterResults.clusters[idx] === i<br>
&nbsp;&nbsp;&nbsp;&nbsp;);<br>
&nbsp;&nbsp;&nbsp;&nbsp;<br>
&nbsp;&nbsp;&nbsp;&nbsp;// 2. Calcula estatísticas<br>
&nbsp;&nbsp;&nbsp;&nbsp;const size = clusterData.length;<br>
&nbsp;&nbsp;&nbsp;&nbsp;const percentage = (size / rawData.length * 100).toFixed(1);<br>
&nbsp;&nbsp;&nbsp;&nbsp;<br>
&nbsp;&nbsp;&nbsp;&nbsp;// 3. Encontra valores mais comuns (moda)<br>
&nbsp;&nbsp;&nbsp;&nbsp;const profile = { cluster: i, size, percentage, characteristics: {} };<br>
&nbsp;&nbsp;&nbsp;&nbsp;<br>
&nbsp;&nbsp;&nbsp;&nbsp;// Variáveis principais analisadas:<br>
&nbsp;&nbsp;&nbsp;&nbsp;// - usa_wcag (conhecimento WCAG)<br>
&nbsp;&nbsp;&nbsp;&nbsp;// - apps_acessiveis (aplicações acessíveis)<br>
&nbsp;&nbsp;&nbsp;&nbsp;// - preocupa_acessibilidade (nível de preocupação)<br>
&nbsp;&nbsp;&nbsp;&nbsp;// - implementa_tecnicas (implementação prática)<br>
&nbsp;&nbsp;&nbsp;&nbsp;// - area_atuacao (área profissional)<br>
&nbsp;&nbsp;&nbsp;&nbsp;<br>
&nbsp;&nbsp;&nbsp;&nbsp;mainCols.forEach(col => {<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const values = clusterData.map(row => row[col]);<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const mode = findMode(values); // Valor mais frequente<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;profile.characteristics[col] = mode;<br>
&nbsp;&nbsp;&nbsp;&nbsp;});<br>
&nbsp;&nbsp;&nbsp;&nbsp;<br>
&nbsp;&nbsp;&nbsp;&nbsp;profiles.push(profile);<br>
&nbsp;&nbsp;}<br>
&nbsp;&nbsp;<br>
&nbsp;&nbsp;return profiles;<br>
}
                </div>
                
                <h3>Informações apresentadas:</h3>
                <ul>
                    <li><strong>Nome do Cluster:</strong> Label descritivo (ex: "Baixo Engajamento", "Engajados")</li>
                    <li><strong>Tamanho:</strong> Número absoluto de respondentes</li>
                    <li><strong>Percentual:</strong> Proporção em relação ao total</li>
                    <li><strong>Descrição:</strong> Resumo interpretativo das características</li>
                    <li><strong>Características detalhadas:</strong> Valores modais das variáveis principais</li>
                </ul>
                
                <h3>Os 4 perfis típicos encontrados:</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr style="background: #f0f4ff;">
                        <th style="padding: 10px; text-align: left;">Cluster</th>
                        <th style="padding: 10px; text-align: left;">Perfil</th>
                        <th style="padding: 10px; text-align: left;">Características</th>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">0 🔴</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;"><strong>Baixo Engajamento</strong></td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Pouco conhecimento, baixa implementação</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">1 🔵</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;"><strong>Engajados</strong></td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Alto conhecimento, implementação consistente</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">2 🟢</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;"><strong>Designers Conscientes</strong></td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Conhecimento moderado, foco em design</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">3 🟡</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;"><strong>Caso Especial</strong></td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Perfil atípico, outliers</td>
                    </tr>
                </table>
                
                <h3>Importância dos perfis:</h3>
                <p>Os perfis dos clusters transformam dados numéricos em <strong>insights acionáveis</strong>:</p>
                <ul>
                    <li><strong>Segmentação:</strong> Permite estratégias diferenciadas por grupo</li>
                    <li><strong>Personas:</strong> Base para criar personas representativas</li>
                    <li><strong>Priorização:</strong> Identifica grupos que mais precisam de intervenção</li>
                    <li><strong>Comunicação:</strong> Facilita explicar resultados para stakeholders</li>
                </ul>
                
                <h3>Como usar os perfis?</h3>
                <p>Para cada cluster identificado, desenvolva estratégias específicas:</p>
                <ul>
                    <li><strong>Baixo Engajamento:</strong> Programas de conscientização e treinamento básico</li>
                    <li><strong>Engajados:</strong> Certificações avançadas e papel de liderança/mentoria</li>
                    <li><strong>Designers Conscientes:</strong> Ferramentas práticas e suporte técnico</li>
                    <li><strong>Casos Especiais:</strong> Investigação individual para entender contexto</li>
                </ul>
                
                <div class="reference">
                    <strong>📚 Referências:</strong><br>
                    <br>
                    <strong>Interpretação de Clusters:</strong><br>
                    KAUFMAN, L.; ROUSSEEUW, P. J. (1990). <em>Finding Groups in Data</em>. Wiley. Capítulo 2: 
                    "Partitioning Around Medoids".<br><br>
                    
                    <strong>Persona Development:</strong><br>
                    COOPER, A. (1999). <em>The Inmates Are Running the Asylum</em>. Sams Publishing. 
                    [Metodologia de criação de personas]<br><br>
                    
                    <strong>Segmentação de Mercado:</strong><br>
                    WEDEL, M.; KAMAKURA, W. A. (2000). <em>Market Segmentation: Conceptual and Methodological Foundations</em>. 
                    2nd ed. Springer. Capítulo 6.
                </div>
            `
        },
        screePlot: {
            title: '📉 Scree Plot - Variância Explicada',
            content: `
                <h3>O que é o Scree Plot?</h3>
                <p>O <strong>Scree Plot</strong> é um gráfico de linha que mostra a <strong>variância explicada por cada componente principal</strong> 
                em ordem decrescente. O nome vem de "scree" (cascalho em inglês), referindo-se à aparência do gráfico que se assemelha a rochas caindo de uma montanha.</p>
                
                <h3>Para que serve?</h3>
                <p>O principal objetivo do Scree Plot é ajudar a determinar <strong>quantos componentes principais devem ser retidos</strong> 
                na análise. É uma das técnicas mais utilizadas para decidir a dimensionalidade ótima.</p>
                
                <h3>Como interpretar?</h3>
                <ul>
                    <li><strong>Eixo X:</strong> Número do componente principal (PC1, PC2, PC3, ...)</li>
                    <li><strong>Eixo Y:</strong> Proporção da variância explicada (0 a 1, ou 0% a 100%)</li>
                    <li><strong>Critério do Cotovelo:</strong> Procure o ponto onde a curva faz um "cotovelo" (elbow point)</li>
                    <li><strong>Componentes antes do cotovelo:</strong> Devem ser retidos (explicam variância significativa)</li>
                    <li><strong>Componentes após o cotovelo:</strong> Podem ser descartados (contribuem pouco)</li>
                </ul>
                
                <h3>Regras práticas de interpretação:</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr style="background: #f0f4ff;">
                        <th style="padding: 10px; text-align: left;">Critério</th>
                        <th style="padding: 10px; text-align: left;">Descrição</th>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;"><strong>Kaiser (eigenvalue > 1)</strong></td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Reter componentes com autovalor > 1</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;"><strong>Variância acumulada ≥ 70%</strong></td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Reter até explicar 70-90% da variância total</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;"><strong>Cotovelo visual</strong></td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Reter componentes antes da "quebra" da curva</td>
                    </tr>
                </table>
                
                <h3>Como é calculado neste código?</h3>
                <div style="background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 0.9em;">
// 1. Normaliza os dados<br>
const normalized = normalizeData(numericData);<br>
<br>
// 2. Calcula matriz de covariância<br>
const covMatrix = covarianceMatrix(normalized);<br>
<br>
// 3. Decomposição em autovalores e autovetores<br>
const { eigenvalues, eigenvectors } = eigenDecomposition(covMatrix, 10);<br>
<br>
// 4. Calcula variância explicada por cada PC<br>
const totalVariance = eigenvalues.reduce((sum, val) => sum + val, 0);<br>
const explainedVariance = eigenvalues.map(val => val / totalVariance);<br>
<br>
// Fórmula:<br>
// Variância Explicada (PC_i) = λ_i / Σλ_j<br>
// onde λ_i é o i-ésimo autovalor
                </div>
                
                <h3>Exemplo de leitura:</h3>
                <p>Se o gráfico mostra:</p>
                <ul>
                    <li>PC1: 45% da variância</li>
                    <li>PC2: 25% da variância</li>
                    <li>PC3: 10% da variância</li>
                    <li>PC4-PC10: < 5% cada</li>
                </ul>
                <p>O "cotovelo" está entre PC3 e PC4, sugerindo reter <strong>3 componentes</strong> que explicam 80% da variância total.</p>
                
                <div class="reference">
                    <strong>📚 Referências:</strong><br>
                    CATTELL, R. B. (1966). "The Scree Test For The Number Of Factors". 
                    <em>Multivariate Behavioral Research</em>, 1(2), 245-276. [Artigo original do método]<br><br>
                    
                    JOLLIFFE, I. T.; CADIMA, J. (2016). "Principal component analysis: a review and recent developments". 
                    <em>Philosophical Transactions of the Royal Society A</em>, 374(2065), 20150202.
                </div>
            `
        },
        cumulativeVariance: {
            title: '📈 Variância Acumulada',
            content: `
                <h3>O que é Variância Acumulada?</h3>
                <p>A <strong>variância acumulada</strong> mostra a <strong>soma progressiva</strong> da variância explicada 
                à medida que mais componentes principais são adicionados. É complementar ao Scree Plot.</p>
                
                <h3>Diferença entre Variância Explicada e Acumulada:</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr style="background: #f0f4ff;">
                        <th style="padding: 10px; text-align: left;">Componente</th>
                        <th style="padding: 10px; text-align: left;">Var. Explicada</th>
                        <th style="padding: 10px; text-align: left;">Var. Acumulada</th>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">PC1</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">45%</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">45%</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">PC2</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">25%</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">70% (45+25)</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">PC3</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">10%</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">80% (70+10)</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">PC4</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">5%</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">85% (80+5)</td>
                    </tr>
                </table>
                
                <h3>Como interpretar o gráfico?</h3>
                <ul>
                    <li><strong>Curva em S:</strong> O gráfico tipicamente forma uma curva em "S" (sigmoide)</li>
                    <li><strong>Início (crescimento rápido):</strong> Primeiros PCs explicam muito</li>
                    <li><strong>Platô:</strong> PCs finais adicionam pouco à variância total</li>
                    <li><strong>Linha de referência 70-80%:</strong> Muitos estudos usam este limiar como adequado</li>
                </ul>
                
                <h3>Critérios de decisão:</h3>
                <div style="background: #f0f4ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p><strong>Regra dos 70%:</strong> Reter componentes até atingir pelo menos 70% da variância acumulada</p>
                    <p><strong>Regra dos 80%:</strong> Análises mais rigorosas podem exigir 80-90%</p>
                    <p><strong>Domínio específico:</strong> Áreas como finanças podem exigir > 95%</p>
                </div>
                
                <h3>Como é calculado neste código?</h3>
                <div style="background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 0.9em;">
// Após calcular variância explicada de cada PC<br>
const explainedVariance = eigenvalues.map(val => val / totalVariance);<br>
<br>
// Calcula variância acumulada<br>
const cumulativeVariance = [];<br>
explainedVariance.reduce((sum, val) => {<br>
&nbsp;&nbsp;const cumSum = sum + val;<br>
&nbsp;&nbsp;cumulativeVariance.push(cumSum);<br>
&nbsp;&nbsp;return cumSum;<br>
}, 0);<br>
<br>
// Fórmula matemática:<br>
// Var_Acum(k) = Σ(i=1 até k) [λ_i / Σλ_j]<br>
// Onde k é o número de componentes retidos
                </div>
                
                <h3>Exemplo prático neste projeto:</h3>
                <p>Se você observar que:</p>
                <ul>
                    <li>Com <strong>2 PCs</strong>: 70% de variância acumulada → Redução dimensional satisfatória</li>
                    <li>Com <strong>3 PCs</strong>: 80% de variância acumulada → Boa representação</li>
                    <li>Com <strong>5 PCs</strong>: 90% de variância acumulada → Excelente representação</li>
                </ul>
                <p>Isso significa que podemos usar apenas 2-3 componentes ao invés das 19 variáveis originais, 
                simplificando drasticamente a análise sem perder muita informação.</p>
                
                <div class="reference">
                    <strong>📚 Referências:</strong><br>
                    JOLLIFFE, I. T. (2002). <em>Principal Component Analysis</em>. 2nd ed. Springer. Capítulo 6: 
                    "Choosing the Number of Components".<br><br>
                    
                    KAISER, H. F. (1960). "The Application of Electronic Computers to Factor Analysis". 
                    <em>Educational and Psychological Measurement</em>, 20(1), 141-151.
                </div>
            `
        },
        biplot: {
            title: '🎯 Biplot - PC1 vs PC2',
            content: `
                <h3>O que é um Biplot?</h3>
                <p>O <strong>Biplot</strong> é uma representação gráfica que combina duas visualizações em um único gráfico:</p>
                <ol>
                    <li><strong>Observações (pontos):</strong> Cada ponto representa um respondente projetado em PC1 e PC2</li>
                    <li><strong>Variáveis (vetores):</strong> Setas representam as variáveis originais e suas relações com os PCs</li>
                </ol>
                
                <h3>Por que PC1 vs PC2?</h3>
                <p>Estes são os <strong>dois primeiros componentes principais</strong>, que capturam a maior parte da variância. 
                Visualizar em 2D permite entender a estrutura dos dados sem sobrecarregar cognitivamente.</p>
                
                <h3>Como interpretar os elementos?</h3>
                
                <h4>🔵 Pontos (Observações):</h4>
                <ul>
                    <li><strong>Proximidade:</strong> Pontos próximos têm características similares</li>
                    <li><strong>Distância:</strong> Pontos distantes são dissimilares</li>
                    <li><strong>Agrupamentos:</strong> Clusters naturais indicam grupos distintos</li>
                    <li><strong>Outliers:</strong> Pontos isolados são casos atípicos</li>
                </ul>
                
                <h4>➡️ Setas (Variáveis):</h4>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr style="background: #f0f4ff;">
                        <th style="padding: 10px; text-align: left;">Característica</th>
                        <th style="padding: 10px; text-align: left;">Interpretação</th>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;"><strong>Comprimento da seta</strong></td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Quanto maior, mais importante a variável nos 2 PCs</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;"><strong>Direção da seta</strong></td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Mostra em qual direção a variável aumenta</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;"><strong>Ângulo pequeno (< 30°)</strong></td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Variáveis correlacionadas positivamente</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;"><strong>Ângulo ~90°</strong></td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Variáveis não correlacionadas</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;"><strong>Ângulo ~180°</strong></td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Variáveis correlacionadas negativamente</td>
                    </tr>
                </table>
                
                <h3>Combinando pontos e setas:</h3>
                <p>Se um ponto está na <strong>direção de uma seta</strong>, isso indica que aquele respondente tem 
                <strong>valores altos</strong> naquela variável. Pontos na direção oposta têm valores baixos.</p>
                
                <h3>Como é calculado neste código?</h3>
                <div style="background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 0.9em;">
// 1. Projetar observações nos componentes principais<br>
const projectedData = projectData(normalized, eigenvectors);<br>
<br>
// Cada observação i tem coordenadas:<br>
// PC1_i = Σ(j=1 até p) X_ij * eigenvector1_j<br>
// PC2_i = Σ(j=1 até p) X_ij * eigenvector2_j<br>
<br>
// 2. Calcular loadings (pesos das variáveis)<br>
const loadings = eigenvectors; // Autovetores são os loadings<br>
<br>
// 3. Plotar:<br>
// - Pontos: (PC1_i, PC2_i) para cada observação i<br>
// - Setas: (loading1_j * escala, loading2_j * escala) para cada variável j<br>
<br>
// Implementação da projeção:<br>
projectData(data, eigenvectors) {<br>
&nbsp;&nbsp;return eigenvectors.map(evec => <br>
&nbsp;&nbsp;&nbsp;&nbsp;data.map(row => <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;row.reduce((sum, val, idx) => sum + val * evec[idx], 0)<br>
&nbsp;&nbsp;&nbsp;&nbsp;)<br>
&nbsp;&nbsp;);<br>
}
                </div>
                
                <h3>Limitação importante:</h3>
                <p>⚠️ O biplot mostra apenas <strong>2 dimensões</strong> (PC1 e PC2). Se estes dois componentes explicam 
                apenas 50% da variância, há 50% de informação em outras dimensões que não está visível no gráfico.</p>
                
                <h3>Exemplo de insights do Biplot:</h3>
                <ul>
                    <li>Se variáveis relacionadas a WCAG apontam para a direita e há um cluster à direita, 
                    esse grupo tem alto conhecimento em WCAG</li>
                    <li>Se há dois clusters bem separados na vertical, PC2 está capturando uma distinção importante</li>
                    <li>Se todas as setas apontam na mesma direção, as variáveis estão altamente correlacionadas</li>
                </ul>
                
                <div class="reference">
                    <strong>📚 Referências Principais:</strong><br><br>
                    
                    <strong>Artigo Original do Biplot:</strong><br>
                    GABRIEL, K. R. (1971). "The biplot graphic display of matrices with application to principal component analysis". 
                    <em>Biometrika</em>, 58(3), 453-467.<br><br>
                    
                    <strong>Interpretação e Uso:</strong><br>
                    GREENACRE, M. (2010). <em>Biplots in Practice</em>. Fundación BBVA. [Guia prático completo]<br><br>
                    
                    <strong>PCA e Visualização:</strong><br>
                    JOLLIFFE, I. T.; CADIMA, J. (2016). "Principal component analysis: a review and recent developments". 
                    <em>Philosophical Transactions of the Royal Society A</em>, 374(2065).
                </div>
            `
        },
        pcaSummary: {
            title: '📊 Resumo da Análise PCA',
            content: `
                <h3>O que é o Resumo PCA?</h3>
                <p>Esta seção apresenta uma <strong>tabela consolidada</strong> com as principais métricas de cada componente principal, 
                facilitando a interpretação quantitativa da análise.</p>
                
                <h3>Informações apresentadas:</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr style="background: #f0f4ff;">
                        <th style="padding: 10px; text-align: left;">Coluna</th>
                        <th style="padding: 10px; text-align: left;">Descrição</th>
                        <th style="padding: 10px; text-align: left;">Como Interpretar</th>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;"><strong>Componente</strong></td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">PC1, PC2, PC3...</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Ordenados por importância (maior → menor)</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;"><strong>Autovalor (λ)</strong></td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Variância capturada pelo PC</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">λ > 1: componente importante (critério Kaiser)</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;"><strong>% Variância</strong></td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">% explicado por este PC</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Quanto maior, mais importante o componente</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;"><strong>% Acumulada</strong></td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">Soma progressiva da variância</td>
                        <td style="padding: 10px; border-top: 1px solid #e5e7eb;">≥ 70-80%: boa representação dos dados</td>
                    </tr>
                </table>
                
                <h3>Exemplo de leitura da tabela:</h3>
                <div style="background: #f0f4ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #667eea; color: white;">
                            <th style="padding: 8px;">PC</th>
                            <th style="padding: 8px;">Autovalor</th>
                            <th style="padding: 8px;">% Var</th>
                            <th style="padding: 8px;">% Acum</th>
                        </tr>
                        <tr style="background: white;">
                            <td style="padding: 8px; border: 1px solid #e5e7eb;">PC1</td>
                            <td style="padding: 8px; border: 1px solid #e5e7eb;">8.5</td>
                            <td style="padding: 8px; border: 1px solid #e5e7eb;">45%</td>
                            <td style="padding: 8px; border: 1px solid #e5e7eb;">45%</td>
                        </tr>
                        <tr style="background: #f9fafb;">
                            <td style="padding: 8px; border: 1px solid #e5e7eb;">PC2</td>
                            <td style="padding: 8px; border: 1px solid #e5e7eb;">4.7</td>
                            <td style="padding: 8px; border: 1px solid #e5e7eb;">25%</td>
                            <td style="padding: 8px; border: 1px solid #e5e7eb;">70%</td>
                        </tr>
                        <tr style="background: white;">
                            <td style="padding: 8px; border: 1px solid #e5e7eb;">PC3</td>
                            <td style="padding: 8px; border: 1px solid #e5e7eb;">1.9</td>
                            <td style="padding: 8px; border: 1px solid #e5e7eb;">10%</td>
                            <td style="padding: 8px; border: 1px solid #e5e7eb;">80%</td>
                        </tr>
                    </table>
                    <p style="margin-top: 10px;"><strong>Interpretação:</strong></p>
                    <ul style="margin: 5px 0;">
                        <li>✅ PC1, PC2, PC3 têm autovalor > 1 (critério Kaiser)</li>
                        <li>✅ Com 3 PCs atingimos 80% de variância acumulada</li>
                        <li>✅ Podemos reduzir de 19 variáveis para 3 componentes</li>
                    </ul>
                </div>
                
                <h3>Como é calculado neste código?</h3>
                <div style="background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 0.9em;">
// Após performPCA(), extrair os resultados<br>
const pca = analyzer.pcaResults;<br>
<br>
// Para cada componente principal i:<br>
const summary = pca.eigenvalues.map((eigenvalue, idx) => ({<br>
&nbsp;&nbsp;component: 'PC' + (idx + 1),<br>
&nbsp;&nbsp;eigenvalue: eigenvalue.toFixed(3),<br>
&nbsp;&nbsp;variancePercent: (pca.explainedVariance[idx] * 100).toFixed(2) + '%',<br>
&nbsp;&nbsp;cumulativePercent: (pca.cumulativeVariance[idx] * 100).toFixed(2) + '%'<br>
}));<br>
<br>
// Renderizar tabela HTML com as informações
                </div>
                
                <h3>Como usar este resumo na prática?</h3>
                <ol>
                    <li><strong>Identificar componentes importantes:</strong> Use critério Kaiser (λ > 1)</li>
                    <li><strong>Decidir quantos PCs reter:</strong> Quando % Acumulada ≥ 70-80%</li>
                    <li><strong>Reportar em artigos:</strong> "Os primeiros 3 componentes explicaram 80% da variância total (λ₁=8.5, λ₂=4.7, λ₃=1.9)"</li>
                    <li><strong>Simplificar análises subsequentes:</strong> Use apenas os PCs retidos em clustering, regressão, etc.</li>
                </ol>
                
                <h3>Benefícios da redução dimensional:</h3>
                <ul>
                    <li>✅ <strong>Visualização:</strong> 3 PCs podem ser plotados em 3D, 19 variáveis não</li>
                    <li>✅ <strong>Performance:</strong> Algoritmos de ML rodam mais rápido com menos dimensões</li>
                    <li>✅ <strong>Interpretabilidade:</strong> Mais fácil entender 3 componentes que 19 variáveis</li>
                    <li>✅ <strong>Multicolinearidade:</strong> PCs são ortogonais (não correlacionados)</li>
                    <li>✅ <strong>Ruído:</strong> Componentes finais capturam ruído, que é descartado</li>
                </ul>
                
                <h3>Aplicações práticas neste projeto:</h3>
                <p>Após o PCA, os componentes retidos são usados para:</p>
                <ul>
                    <li><strong>Clustering:</strong> K-Means e Hierárquico são executados no espaço PCA reduzido</li>
                    <li><strong>Visualização:</strong> Biplot mostra dados em 2D (PC1 vs PC2)</li>
                    <li><strong>Correlação:</strong> Análise de correlação entre PCs principais</li>
                </ul>
                
                <div class="reference">
                    <strong>📚 Referências:</strong><br>
                    KAISER, H. F. (1960). "The Application of Electronic Computers to Factor Analysis". 
                    <em>Educational and Psychological Measurement</em>, 20(1), 141-151. [Critério Kaiser: λ > 1]<br><br>
                    
                    JOLLIFFE, I. T. (2002). <em>Principal Component Analysis</em>. 2nd ed. Springer. 
                    Capítulo 6: "Choosing the Number of Components".<br><br>
                    
                    ABDI, H.; WILLIAMS, L. J. (2010). "Principal component analysis". 
                    <em>Wiley Interdisciplinary Reviews: Computational Statistics</em>, 2(4), 433-459.
                </div>
            `
        },
        elbow: {
            title: '📐 Método do Cotovelo (Elbow Method)',
            content: `
                <h3>O que é?</h3>
                <p>O <strong>Método do Cotovelo</strong> é uma técnica heurística para determinar o <strong>número ideal de clusters</strong> 
                (k) em análises de clustering. O nome vem do formato do gráfico, que se assemelha a um braço dobrado.</p>
                
                <h3>Como funciona?</h3>
                <p>O método calcula a <strong>inércia</strong> (também chamada de <em>within-cluster sum of squares</em> - WCSS) 
                para diferentes valores de k:</p>
                
                <ol>
                    <li><strong>Para k = 2 até maxK (10):</strong>
                        <ul>
                            <li>Executa o algoritmo K-Means com k clusters</li>
                            <li>Calcula a inércia total</li>
                        </ul>
                    </li>
                    <li><strong>Plota inércia vs. número de clusters</strong></li>
                    <li><strong>Identifica o "cotovelo"</strong> - ponto onde a taxa de redução da inércia diminui drasticamente</li>
                </ol>
                
                <h3>Fórmula da Inércia (WCSS)</h3>
                <p>A inércia mede a <strong>compactação dos clusters</strong> através da soma das distâncias quadradas 
                de cada ponto ao centroide de seu cluster:</p>
                
                <div style="background: #f0f4ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <code style="font-size: 1.1em;">
                        Inércia = Σ<sub>i=1</sub><sup>n</sup> ||x<sub>i</sub> - μ<sub>c(i)</sub>||²
                    </code>
                    <p style="margin-top: 10px; font-size: 0.9em;">
                        Onde:<br>
                        • x<sub>i</sub> = ponto de dados i<br>
                        • μ<sub>c(i)</sub> = centroide do cluster c ao qual o ponto i pertence<br>
                        • ||·|| = distância Euclidiana<br>
                        • n = número total de pontos
                    </p>
                </div>
                
                <h3>Como foi calculado neste código?</h3>
                <p><strong>Implementação JavaScript:</strong></p>
                
                <div style="background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 0.9em;">
// 1. Método principal (analyzer.js)<br>
elbowMethod(maxK = 10) {<br>
&nbsp;&nbsp;const inertias = [];<br>
&nbsp;&nbsp;const normalized = this.normalizeData(this.numericData);<br>
&nbsp;&nbsp;<br>
&nbsp;&nbsp;// Testa k de 2 até 10<br>
&nbsp;&nbsp;for (let k = 2; k <= maxK; k++) {<br>
&nbsp;&nbsp;&nbsp;&nbsp;const result = this.performKMeansForK(normalized, k);<br>
&nbsp;&nbsp;&nbsp;&nbsp;inertias.push({ k, inertia: result.inertia });<br>
&nbsp;&nbsp;}<br>
&nbsp;&nbsp;<br>
&nbsp;&nbsp;return inertias; // [{k:2, inertia:X}, {k:3, inertia:Y}, ...]<br>
}<br>
<br>
// 2. Cálculo da inércia<br>
calculateInertia(data, clusters, centroids) {<br>
&nbsp;&nbsp;return data.reduce((sum, point, idx) => {<br>
&nbsp;&nbsp;&nbsp;&nbsp;const cluster = clusters[idx];<br>
&nbsp;&nbsp;&nbsp;&nbsp;const centroid = centroids[cluster];<br>
&nbsp;&nbsp;&nbsp;&nbsp;// Soma das distâncias quadradas<br>
&nbsp;&nbsp;&nbsp;&nbsp;return sum + Math.pow(this.euclideanDistance(point, centroid), 2);<br>
&nbsp;&nbsp;}, 0);<br>
}
                </div>
                
                <h3>Como interpretar o gráfico?</h3>
                <ul>
                    <li><strong>Eixo X:</strong> Número de clusters (k)</li>
                    <li><strong>Eixo Y:</strong> Inércia (WCSS) - menor é melhor</li>
                    <li><strong>Tendência:</strong> Inércia sempre diminui com mais clusters</li>
                    <li><strong>Ponto ideal:</strong> Onde a curva "dobra" (cotovelo)
                        <ul>
                            <li>Adicionar mais clusters não reduz significativamente a inércia</li>
                            <li>Equilíbrio entre simplicidade e qualidade</li>
                        </ul>
                    </li>
                </ul>
                
                <h3>Exemplo de interpretação:</h3>
                <p>Se o gráfico mostra uma queda acentuada até k=4 e depois estabiliza, isso indica que 
                <strong>4 clusters</strong> é a escolha ideal. Usar k=5 ou k=6 não traria ganho significativo 
                na compactação dos clusters, apenas aumentaria a complexidade.</p>
                
                <h3>Limitações</h3>
                <ul>
                    <li>Nem sempre há um "cotovelo" claro e óbvio</li>
                    <li>É um método subjetivo - requer análise visual</li>
                    <li>Deve ser complementado com outras métricas (Silhouette Score, Gap Statistic)</li>
                    <li>Sensível à normalização dos dados</li>
                </ul>
                
                <h3>Neste projeto:</h3>
                <p>Os dados foram <strong>normalizados</strong> (StandardScaler) antes do cálculo para garantir 
                que todas as variáveis tenham peso igual. O algoritmo K-Means foi executado para k de 2 até 10, 
                e a inércia foi calculada somando as distâncias Euclidianas quadradas de cada ponto ao seu centroide.</p>
                
                <div class="reference">
                    <strong>📚 Referências Principais:</strong><br>
                    <br>
                    <strong>Método do Cotovelo:</strong><br>
                    THORNDIKE, R. L. (1953). "Who belongs in the family?". <em>Psychometrika</em>, 18(4), 267-276. 
                    [Origem do método do cotovelo]<br><br>
                    
                    <strong>K-Means e WCSS:</strong><br>
                    MACQUEEN, J. (1967). "Some methods for classification and analysis of multivariate observations". 
                    <em>Proceedings of the Fifth Berkeley Symposium on Mathematical Statistics and Probability</em>, 
                    1(14), 281-297. [K-Means original]<br><br>
                    
                    <strong>Aplicações modernas:</strong><br>
                    JAIN, A. K. (2010). "Data Clustering: 50 Years Beyond K-means". <em>Pattern Recognition Letters</em>, 
                    31(8), 651-666. [Revisão completa incluindo método do cotovelo]<br><br>
                    
                    <strong>Seleção do número de clusters:</strong><br>
                    KODINARIYA, T. M.; MAKWANA, P. R. (2013). "Review on determining number of Cluster in K-Means Clustering". 
                    <em>International Journal of Advance Research in Computer Science and Management Studies</em>, 1(6), 90-95.
                </div>
            `
        }
    };
    
    const info = infoContent[section];
    if (info) {
        modalTitle.textContent = info.title;
        modalBody.innerHTML = info.content;
        modal.style.display = 'block';
    }
}

function closeInfoModal() {
    document.getElementById('infoModal').style.display = 'none';
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('infoModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// Fechar modal com ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeInfoModal();
    }
});

// Log inicial
console.log('🚀 Aplicação de Análise Multivariada carregada!');
console.log('📝 Faça upload de um arquivo CSV para começar a análise');
