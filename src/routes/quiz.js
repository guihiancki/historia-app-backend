const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

router.get('/gerar/:moduloId', async (req, res) => {
  try {
    const { moduloId } = req.params;
    const { quantidade = 10, dificuldade } = req.query;

    let query = supabase
      .from('perguntas')
      .select('*')
      .eq('modulo_id', moduloId)
      .eq('activa', true);

    if (dificuldade) {
      query = query.eq('dificuldade', parseInt(dificuldade));
    }

    const { data: perguntas, error } = await query;

    if (error) throw error;

    if (!perguntas || perguntas.length === 0) {
      return res.status(404).json({ erro: 'Nenhuma pergunta encontrada para este módulo' });
    }

    const perguntasEmbaralhadas = perguntas
      .sort(() => Math.random() - 0.5)
      .slice(0, parseInt(quantidade));

    const quizPerguntas = perguntasEmbaralhadas.map(p => ({
      id: p.id,
      enunciado: p.enunciado,
      tipo: p.tipo,
      opcao_a: p.opcao_a,
      opcao_b: p.opcao_b,
      opcao_c: p.opcao_c,
      opcao_d: p.opcao_d,
      opcao_e: p.opcao_e,
      dificuldade: p.dificuldade
    }));

    res.json({
      modulo_id: parseInt(moduloId),
      total: quizPerguntas.length,
      perguntas: quizPerguntas
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/submeter/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { modulo_id, respostas, tempo_segundos } = req.body;

    if (!modulo_id || !respostas || !Array.isArray(respostas)) {
      return res.status(400).json({ erro: 'Módulo ID e respostas são obrigatórios' });
    }

    const { data: perguntas, error: perguntasError } = await supabase
      .from('perguntas')
      .select('id, resposta_correta')
      .in('id', respostas.map(r => r.pergunta_id));

    if (perguntasError) throw perguntasError;

    const mapaRespostas = {};
    perguntas.forEach(p => {
      mapaRespostas[p.id] = p.resposta_correta;
    });

    let acertouCount = 0;
    const resultados = respostas.map(r => {
      const acertou = mapaRespostas[r.pergunta_id] === r.resposta;
      if (acertou) acertouCount++;
      return {
        pergunta_id: r.pergunta_id,
        resposta_usuario: r.resposta,
        acertou
      };
    });

    const totalPerguntas = respostas.length;
    const percentual = (acertouCount / totalPerguntas) * 100;
    const xpGanho = Math.round(acertouCount * 10 + (percentual === 100 ? 50 : 0));

    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert([{
        usuario_id: usuarioId,
        modulo_id,
        pontuacao: acertouCount,
        total_perguntas: totalPerguntas,
        perguntas_acertadas: acertouCount,
        xp_ganho: xpGanho,
        tempo_segundos: tempo_segundos,
        completado: true
      }])
      .select()
      .single();

    if (quizError) throw quizError;

    for (const resultado of resultados) {
      await supabase.from('respostas_quiz').insert([{
        quiz_id: quiz.id,
        pergunta_id: resultado.pergunta_id,
        resposta_usuario: resultado.resposta_usuario,
        acertou: resultado.acertou
      }]);
    }

    const { data: usuarioAtual } = await supabase
      .from('usuarios')
      .select('xp_total, nivel')
      .eq('id', usuarioId)
      .single();

    const novoXp = (usuarioAtual?.xp_total || 0) + xpGanho;
    const novoNivel = Math.floor(novoXp / 100) + 1;

    await supabase
      .from('usuarios')
      .update({
        xp_total: novoXp,
        nivel: novoNivel,
        ultima_actividade: new Date().toISOString().split('T')[0]
      })
      .eq('id', usuarioId);

    await atualizarProgresso(usuarioId, modulo_id, acertouCount, totalPerguntas);

    res.json({
      quiz_id: quiz.id,
      resultado: {
        total: totalPerguntas,
        acertou: acertouCount,
        errou: totalPerguntas - acertouCount,
        percentual: Math.round(percentual),
        xp_ganho: xpGanho,
        nivel_atual: novoNivel
      },
      perguntas: resultados.map((r, i) => ({
        ...r,
        resposta_correta: mapaRespostas[r.pergunta_id]
      }))
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.get('/historico/:usuarioId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*, modulos(nome, disciplinas(nome))')
      .eq('usuario_id', req.params.usuarioId)
      .order('criado_em', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

async function atualizarProgresso(usuarioId, moduloId, acertou, total) {
  const { data: existente } = await supabase
    .from('progresso_usuario')
    .select('*')
    .eq('usuario_id', usuarioId)
    .eq('modulo_id', moduloId)
    .single();

  const { count: totalAulas } = await supabase
    .from('aulas')
    .select('*', { count: 'exact', head: true })
    .eq('modulo_id', moduloId);

  if (existente) {
    const novasRespondidas = existente.perguntas_respondidas + total;
    const novasAcertadas = existente.perguntas_acertadas + acertou;
    const percentual = novasRespondidas > 0 ? (novasAcertadas / novasRespondidas) * 100 : 0;

    await supabase
      .from('progresso_usuario')
      .update({
        perguntas_respondidas: novasRespondidas,
        perguntas_acertadas: novasAcertadas,
        percentual: Math.round(percentual * 100) / 100,
        completo: percentual >= 80,
        total_aulas: totalAulas || 0,
        ultima_actividade: new Date().toISOString()
      })
      .eq('id', existente.id);
  } else {
    const percentual = total > 0 ? (acertou / total) * 100 : 0;

    await supabase
      .from('progresso_usuario')
      .insert([{
        usuario_id: usuarioId,
        modulo_id: moduloId,
        perguntas_respondidas: total,
        perguntas_acertadas: acertou,
        percentual: Math.round(percentual * 100) / 100,
        total_aulas: totalAulas || 0,
        completo: percentual >= 80
      }]);
  }
}

module.exports = router;
