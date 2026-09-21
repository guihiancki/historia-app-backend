const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

router.get('/:usuarioId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('progresso_usuario')
      .select('*, modulos(nome, disciplina_id, disciplinas(nome, icone, cor))')
      .eq('usuario_id', req.params.usuarioId);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.get('/:usuarioId/modulo/:moduloId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('progresso_usuario')
      .select('*, modulos(nome, disciplina_id)')
      .eq('usuario_id', req.params.usuarioId)
      .eq('modulo_id', req.params.moduloId)
      .single();

    if (error || !data) {
      return res.status(404).json({ erro: 'Progresso não encontrado' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.get('/:usuarioId/resumo', async (req, res) => {
  try {
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id, nome, xp_total, nivel, streak_dias')
      .eq('id', req.params.usuarioId)
      .single();

    if (userError || !usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    const { count: totalQuizzes } = await supabase
      .from('quizzes')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', req.params.usuarioId);

    const { count: modulosCompletos } = await supabase
      .from('progresso_usuario')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', req.params.usuarioId)
      .eq('completo', true);

    const { data: ultimoQuiz } = await supabase
      .from('quizzes')
      .select('pontuacao, total_perguntas, xp_ganho, criado_em')
      .eq('usuario_id', req.params.usuarioId)
      .order('criado_em', { ascending: false })
      .limit(1)
      .single();

    res.json({
      usuario,
      estatisticas: {
        total_quizzes: totalQuizzes || 0,
        modulos_completos: modulosCompletos || 0,
        ultimo_quiz: ultimoQuiz || null
      }
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/:usuarioId/aula/:aulaId/concluir', async (req, res) => {
  try {
    const { usuarioId, aulaId } = req.params;

    const { data: aula, error: aulaError } = await supabase
      .from('aulas')
      .select('modulo_id, xp_recompensa')
      .eq('id', aulaId)
      .single();

    if (aulaError || !aula) {
      return res.status(404).json({ erro: 'Aula não encontrada' });
    }

    const { data: progresso } = await supabase
      .from('progresso_usuario')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('modulo_id', aula.modulo_id)
      .single();

    const { count: totalAulas } = await supabase
      .from('aulas')
      .select('*', { count: 'exact', head: true })
      .eq('modulo_id', aula.modulo_id)
      .eq('activa', true);

    if (progresso) {
      const novasAulas = progresso.aulas_concluidas + 1;
      const percentualAulas = (novasAulas / (totalAulas || 1)) * 100;

      await supabase
        .from('progresso_usuario')
        .update({
          aulas_concluidas: novasAulas,
          total_aulas: totalAulas || 0,
          percentual: Math.round(percentualAulas * 100) / 100,
          ultima_actividade: new Date().toISOString()
        })
        .eq('id', progresso.id);
    } else {
      await supabase
        .from('progresso_usuario')
        .insert([{
          usuario_id: usuarioId,
          modulo_id: aula.modulo_id,
          aulas_concluidas: 1,
          total_aulas: totalAulas || 0,
          percentual: Math.round((1 / (totalAulas || 1)) * 100 * 100) / 100
        }]);
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('xp_total')
      .eq('id', usuarioId)
      .single();

    const novoXp = (usuario?.xp_total || 0) + (aula.xp_recompensa || 10);
    const novoNivel = Math.floor(novoXp / 100) + 1;

    await supabase
      .from('usuarios')
      .update({
        xp_total: novoXp,
        nivel: novoNivel,
        ultima_actividade: new Date().toISOString().split('T')[0]
      })
      .eq('id', usuarioId);

    res.json({
      mensagem: 'Aula concluída com sucesso',
      xp_ganho: aula.xp_recompensa || 10,
      xp_total: novoXp,
      nivel: novoNivel
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/:usuarioId/trilha', async (req, res) => {
  try {
    const { modulo_id, progresso_json } = req.body;
    const { usuarioId } = req.params;

    const { data: existente } = await supabase
      .from('progresso_usuario')
      .select('id')
      .eq('usuario_id', usuarioId)
      .eq('modulo_id', modulo_id)
      .single();

    if (existente) {
      const { error } = await supabase
        .from('progresso_usuario')
        .update({ progresso_json, ultima_actividade: new Date().toISOString() })
        .eq('id', existente.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('progresso_usuario')
        .insert([{
          usuario_id: usuarioId,
          modulo_id: modulo_id,
          progresso_json,
          percentual: 0
        }]);

      if (error) throw error;
    }

    res.json({ mensagem: 'Progresso salvo com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
