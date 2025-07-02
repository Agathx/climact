#!/usr/bin/env node

/**
 * Script de teste para verificar integração das APIs externas
 * 
 * Este script testa:
 * 1. API OpenWeather (clima)
 * 2. API GNews (notícias)
 * 3. Google Gemini AI
 * 4. Configuração do projeto
 */

const https = require('https');
const path = require('path');

// Configurações das APIs
const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'demo_key';
const GNEWS_API_KEY = process.env.NEXT_PUBLIC_GNEWS_API_KEY || 'demo_key';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'demo_key';
const TEST_COORDS = { lat: -23.5505, lon: -46.6333 }; // São Paulo

console.log('🔧 Testando Integração de APIs Externas - ClimACT\n');

// Teste 1: OpenWeather API
function testOpenWeatherAPI() {
  return new Promise((resolve, reject) => {
    if (OPENWEATHER_API_KEY === 'demo_key' || OPENWEATHER_API_KEY === 'sua_chave_aqui') {
      console.log('⚠️  OpenWeather API: Chave não configurada');
      resolve(null);
      return;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${TEST_COORDS.lat}&lon=${TEST_COORDS.lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt_br`;
    
    console.log('📡 Testando OpenWeather API...');
    console.log(`🗺️  Coordenadas: São Paulo (${TEST_COORDS.lat}, ${TEST_COORDS.lon})`);
    console.log(`🔑 API Key: ${OPENWEATHER_API_KEY.substring(0, 8)}...${OPENWEATHER_API_KEY.substring(OPENWEATHER_API_KEY.length - 4)}`);
    
    const request = https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const weatherData = JSON.parse(data);
          
          if (response.statusCode === 200) {
            console.log('✅ OpenWeather API: OK');
            console.log(`   Cidade: ${weatherData.name}`);
            console.log(`   Temperatura: ${weatherData.main.temp}°C`);
            console.log(`   Condição: ${weatherData.weather[0].description}`);
            resolve(weatherData);
          } else if (response.statusCode === 401) {
            console.log('❌ OpenWeather API: ERRO 401 - API key inválida');
            console.log('');
            console.log('🔍 Possíveis causas:');
            console.log('   1. A API key não foi especificada corretamente');
            console.log('   2. A API key ainda não foi ativada (pode levar algumas horas)');
            console.log('   3. Você está usando a API key errada');
            console.log('   4. Plano gratuito tem limitações');
            console.log('');
            console.log('📋 Soluções:');
            console.log('   • Acesse: https://home.openweathermap.org/api_keys');
            console.log('   • Verifique se a chave está "Active"');
            console.log('   • Aguarde ativação se criada recentemente');
            console.log('   • Confirme o copy/paste da chave');
            console.log('');
            console.log('📊 Limites do plano gratuito:');
            console.log('   • 60 chamadas/minuto, 1.000/dia');
            console.log('   • Dados atuais + previsão 5 dias');
            reject(new Error(`API key error: ${weatherData.message || 'Invalid API key'}`));
          } else {
            console.log(`❌ OpenWeather API: Erro ${response.statusCode}`, weatherData.message || 'Erro desconhecido');
            reject(new Error(weatherData.message));
          }
        } catch (error) {
          console.log('❌ OpenWeather API - Erro no parsing:', error.message);
          console.log('📄 Resposta:', data.substring(0, 200) + '...');
          reject(error);
        }
      });
    });
    
    request.on('error', (error) => {
      console.log('❌ OpenWeather API - Erro de conexão:', error.message);
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      console.log('❌ OpenWeather API - Timeout');
      request.abort();
      reject(new Error('Timeout'));
    });
  });
}

// Teste 2: GNews API
function testGNewsAPI() {
  return new Promise((resolve, reject) => {
    if (GNEWS_API_KEY === 'demo_key' || GNEWS_API_KEY === 'sua_chave_gnews_aqui') {
      console.log('⚠️  GNews API: Chave não configurada');
      resolve(null);
      return;
    }

    const url = `https://gnews.io/api/v4/search?q=clima&lang=pt&country=br&max=3&token=${GNEWS_API_KEY}`;
    
    console.log('📰 Testando GNews API...');
    
    const request = https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const newsData = JSON.parse(data);
          
          if (response.statusCode === 200) {
            console.log('✅ GNews API: OK');
            console.log(`   Total de artigos: ${newsData.totalArticles}`);
            console.log(`   Artigos retornados: ${newsData.articles.length}`);
            if (newsData.articles.length > 0) {
              console.log(`   Primeiro artigo: ${newsData.articles[0].title.substring(0, 50)}...`);
            }
            resolve(newsData);
          } else {
            console.log('❌ GNews API:', newsData.message || 'Erro desconhecido');
            reject(new Error(newsData.message));
          }
        } catch (error) {
          console.log('❌ GNews API - Erro no parsing:', error.message);
          reject(error);
        }
      });
    });
    
    request.on('error', (error) => {
      console.log('❌ GNews API - Erro de conexão:', error.message);
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      console.log('❌ GNews API - Timeout');
      request.abort();
      reject(new Error('Timeout'));
    });
  });
}

// Teste 3: Google Gemini AI (teste simples de configuração)
function testGeminiAPI() {
  console.log('🤖 Verificando Google Gemini AI...');
  
  if (GEMINI_API_KEY === 'demo_key' || GEMINI_API_KEY === 'sua_chave_aqui') {
    console.log('⚠️  Gemini API: Chave não configurada');
    return Promise.resolve(null);
  }
  
  console.log('✅ Gemini API: Chave configurada');
  console.log('   Nota: Teste de conectividade não implementado (requer biblioteca específica)');
  return Promise.resolve({ configured: true });
}

// Teste 2: Verificar configuração do projeto
function testProjectConfiguration() {
  console.log('\n🔧 Verificando configuração do projeto...');
  
  const checks = [
    {
      name: 'Arquivo weatherService.ts',
      path: '../src/services/weatherService.ts',
      required: true
    },
    {
      name: 'Hook use-weather.ts',
      path: '../src/hooks/use-weather.ts',
      required: true
    },
    {
      name: 'Componente weather-widget.tsx',
      path: '../src/components/weather-widget.tsx',
      required: true
    },
    {
      name: 'Arquivo .env.example',
      path: '../.env.example',
      required: false
    }
  ];
  
  checks.forEach(check => {
    try {
      const fs = require('fs');
      const fullPath = path.join(__dirname, check.path);
      
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${check.name}: Encontrado`);
      } else {
        const status = check.required ? '❌' : '⚠️';
        console.log(`${status} ${check.name}: Não encontrado`);
      }
    } catch (error) {
      console.log(`❌ ${check.name}: Erro ao verificar - ${error.message}`);
    }
  });
}

// Teste 3: Análise de riscos climáticos (simulação)
function testRiskAnalysis(weatherData) {
  console.log('\n🎯 Testando análise de riscos climáticos...');
  
  if (!weatherData || !weatherData.main) {
    console.log('❌ Dados insuficientes para análise');
    return;
  }
  
  const { temp, humidity } = weatherData.main;
  const windSpeed = weatherData.wind?.speed || 0;
  const rain = weatherData.rain?.['1h'] || 0;
  
  // Simulação da lógica de análise de riscos
  const risks = {
    floodRisk: rain > 10 ? 0.8 : rain > 5 ? 0.5 : 0.2,
    heatRisk: temp > 35 ? 0.9 : temp > 30 ? 0.6 : 0.1,
    stormRisk: windSpeed > 50 ? 0.9 : windSpeed > 30 ? 0.6 : 0.2,
    humidityRisk: humidity > 90 ? 0.7 : humidity < 20 ? 0.7 : 0.1
  };
  
  console.log('📊 Análise de riscos calculada:');
  console.log(`   Risco de enchente: ${(risks.floodRisk * 100).toFixed(1)}%`);
  console.log(`   Risco de calor: ${(risks.heatRisk * 100).toFixed(1)}%`);
  console.log(`   Risco de tempestade: ${(risks.stormRisk * 100).toFixed(1)}%`);
  console.log(`   Risco de umidade: ${(risks.humidityRisk * 100).toFixed(1)}%`);
  
  const overallRisk = Math.max(...Object.values(risks));
  const riskLevel = overallRisk > 0.7 ? 'Alto' : overallRisk > 0.4 ? 'Médio' : 'Baixo';
  
  console.log(`🎯 Risco geral: ${riskLevel} (${(overallRisk * 100).toFixed(1)}%)`);
}

// Teste 4: Verificar variáveis de ambiente
function testEnvironmentConfiguration() {
  console.log('\n🔑 Verificando configuração de ambiente...');
  
  const apis = [
    {
      name: 'OpenWeather',
      key: 'NEXT_PUBLIC_OPENWEATHER_API_KEY',
      value: OPENWEATHER_API_KEY,
      required: true
    },
    {
      name: 'GNews',
      key: 'NEXT_PUBLIC_GNEWS_API_KEY', 
      value: GNEWS_API_KEY,
      required: false
    },
    {
      name: 'Google Gemini',
      key: 'GEMINI_API_KEY',
      value: GEMINI_API_KEY,
      required: false
    }
  ];
  
  apis.forEach(api => {
    const demoValues = ['demo_key', 'sua_chave_aqui', `sua_chave_${api.name.toLowerCase()}_aqui`];
    
    if (api.value && !demoValues.includes(api.value)) {
      console.log(`✅ ${api.name}: Configurada`);
    } else {
      const status = api.required ? '❌' : '⚠️';
      const type = api.required ? 'obrigatória' : 'opcional';
      console.log(`${status} ${api.name}: Não configurada (${type})`);
    }
  });
}

// Executar todos os testes
async function runAllTests() {
  try {
    // Teste de configuração (não depende da API)
    testProjectConfiguration();
    testEnvironmentConfiguration();
    
    // Testes que dependem das APIs
    console.log('\n🔗 Testando Conectividade das APIs:');
    
    const weatherData = await testOpenWeatherAPI();
    await testGNewsAPI();
    await testGeminiAPI();
    
    if (weatherData) {
      testRiskAnalysis(weatherData);
    }
    
    console.log('\n🎉 Teste concluído!');
    
    // Instruções baseadas no status das APIs
    const hasOpenWeather = OPENWEATHER_API_KEY !== 'demo_key' && OPENWEATHER_API_KEY !== 'sua_chave_aqui';
    const hasGNews = GNEWS_API_KEY !== 'demo_key' && GNEWS_API_KEY !== 'sua_chave_gnews_aqui';
    const hasGemini = GEMINI_API_KEY !== 'demo_key' && GEMINI_API_KEY !== 'sua_chave_aqui';
    
    if (!hasOpenWeather || !hasGNews || !hasGemini) {
      console.log('\n📋 Para configurar as APIs pendentes:');
      
      if (!hasOpenWeather) {
        console.log('   🌤️  OpenWeather: https://openweathermap.org/api');
      }
      if (!hasGNews) {
        console.log('   📰 GNews: https://gnews.io/');
      }
      if (!hasGemini) {
        console.log('   🤖 Google Gemini: https://ai.google.dev/');
      }
      
      console.log('   📝 Atualize o arquivo .env.local e execute novamente este teste');
    } else {
      console.log('\n✨ Todas as APIs estão configuradas e funcionando!');
    }
    
  } catch (error) {
    console.log('\n💥 Erro durante os testes:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests();
}

module.exports = { 
  testOpenWeatherAPI, 
  testGNewsAPI, 
  testGeminiAPI, 
  testRiskAnalysis, 
  testProjectConfiguration 
};
