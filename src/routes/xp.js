const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

router.post('/:usuarioId/xp', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { xp_ganho } = req.body;

    if (!xp_ganho || xp_ganho <= 0) {
      return res.status(400).json({ erro: 'XP deve ser maior que 0' });
    }

    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('xp_total')
      .eq('id', usuarioId)
      .single();

    if (userError || !usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    const novoXp = (usuario.xp_total || 0) + xp_ganho;
    const novoNivel = Math.floor(novoXp / 100) + 1;

    const { error } = await supabase
      .from('usuarios')
      .update({
        xp_total: novoXp,
        nivel: novoNivel,
        ultima_actividade: new Date().toISOString().split('T')[0]
      })
      .eq('id', usuarioId);

    if (error) throw error;

    res.json({
      xp_ganho,
      xp_total: novoXp,
      nivel: novoNivel
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
