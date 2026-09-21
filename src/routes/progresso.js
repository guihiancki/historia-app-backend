const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

router.get('/:usuarioId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('progresso_usuario')
      .select('*')
      .eq('usuario_id', req.params.usuarioId);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.json([]);
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

    const { data: progresso } = await supabase
      .from('progresso_usuario')
      .select('*')
      .eq('usuario_id', req.params.usuarioId);

    let trilhasIniciadas = 0;
    let trilhasCompletas = 0;
    let totalEtapas = 0;
    let etapasCompletas = 0;

    if (progresso) {
      for (const p of progresso) {
        if (p.modulo_id === 99 && p.progresso_json) {
          try {
            const todo = JSON.parse(p.progresso_json);
            const trilhas = Object.keys(todo);
            trilhasIniciadas = trilhas.length;
            
            for (const trilhaId of trilhas) {
              const etapas = todo[trilhaId];
              if (etapas && etapas.length > 0) {
                totalEtapas += etapas.length;
                const completas = etapas.filter(e => e.completa).length;
                etapasCompletas += completas;
                if (completas === etapas.length) {
                  trilhasCompletas++;
                }
              }
            }
          } catch(e) {}
        }
      }
    }

    res.json({
      usuario,
      estatisticas: {
        trilhas_iniciadas: trilhasIniciadas,
        trilhas_completas: trilhasCompletas,
        total_etapas: totalEtapas,
        etapas_completas: etapasCompletas,
        percentual_geral: totalEtapas > 0 ? Math.round((etapasCompletas / totalEtapas) * 100) : 0
      }
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
      .maybeSingle();

    if (existente) {
      const { error } = await supabase
        .from('progresso_usuario')
        .update({ 
          progresso_json, 
          ultima_actividade: new Date().toISOString(),
          percentual: 100
        })
        .eq('id', existente.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('progresso_usuario')
        .insert([{
          usuario_id: parseInt(usuarioId),
          modulo_id: modulo_id,
          progresso_json: progresso_json,
          percentual: 100
        }]);

      if (error) throw error;
    }

    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
