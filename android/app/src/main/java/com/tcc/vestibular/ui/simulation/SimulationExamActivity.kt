package com.tcc.vestibular.ui.simulation

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.RadioButton
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.tcc.vestibular.data.api.ApiClient
import com.tcc.vestibular.data.models.ActiveSimulationData
import com.tcc.vestibular.data.models.SaveSimulationAnswerRequest
import com.tcc.vestibular.databinding.ActivitySimulationExamBinding
import kotlinx.coroutines.launch

class SimulationExamActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySimulationExamBinding
    private lateinit var simulationData: ActiveSimulationData
    private var currentIndex: Int = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySimulationExamBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val data = intent.getSerializableExtra("EXTRA_SIMULATION_DATA") as? ActiveSimulationData
        if (data == null || data.questions.isEmpty()) {
            Toast.makeText(this, "Não foi possível carregar o simulado.", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        simulationData = data
        currentIndex = if (data.currentQuestionIndex in data.questions.indices) data.currentQuestionIndex else 0

        binding.tvExamTitle.text = simulationData.title
        binding.pbExamProgress.max = simulationData.totalQuestions

        setupClickListeners()
        renderCurrentQuestion()
    }

    private fun setupClickListeners() {
        binding.btnExamPrevious.setOnClickListener {
            if (currentIndex > 0) {
                currentIndex--
                renderCurrentQuestion()
            }
        }

        binding.btnExamNext.setOnClickListener {
            if (currentIndex < simulationData.questions.size - 1) {
                currentIndex++
                renderCurrentQuestion()
            }
        }

        binding.btnExamFinish.setOnClickListener {
            showFinishConfirmationDialog()
        }
    }

    private fun renderCurrentQuestion() {
        val total = simulationData.questions.size
        val q = simulationData.questions[currentIndex]

        binding.tvExamProgressCount.text = "Questão ${currentIndex + 1} de $total"
        binding.pbExamProgress.progress = currentIndex + 1

        binding.tvExamQuestionBadge.text = "${q.vestibularAcronym} ${q.year}"
        binding.tvExamSubjectBadge.text = q.subjectName
        binding.tvExamStatement.text = q.statement

        // Carrega imagem da questão do simulado se existir
        com.tcc.vestibular.data.utils.ImageLoader.loadImage(
            binding.ivExamQuestionImage,
            q.imageUrl,
            lifecycleScope
        )

        // Habilita / Desabilita botões conforme posição
        binding.btnExamPrevious.isEnabled = currentIndex > 0
        binding.btnExamNext.isEnabled = currentIndex < total - 1

        // Renderiza alternativas
        binding.rgExamAlternatives.setOnCheckedChangeListener(null)
        binding.rgExamAlternatives.removeAllViews()

        q.alternatives.forEach { alt ->
            val rb = RadioButton(this).apply {
                id = alt.id
                text = "(${alt.letter}) ${alt.text}"
                textSize = 15f
                setPadding(12, 16, 12, 16)
                isChecked = (alt.id == q.selectedAlternativeId)
            }
            binding.rgExamAlternatives.addView(rb)
        }

        binding.rgExamAlternatives.setOnCheckedChangeListener { _, checkedId ->
            if (checkedId != -1) {
                q.selectedAlternativeId = checkedId
                persistAnswer(q.questionId, checkedId)
            }
        }
    }

    private fun persistAnswer(questionId: Int, alternativeId: Int) {
        lifecycleScope.launch {
            try {
                val apiService = ApiClient.getService(this@SimulationExamActivity)
                apiService.saveSimulationAnswer(
                    simulationData.id,
                    SaveSimulationAnswerRequest(
                        questionId = questionId,
                        alternativeId = alternativeId,
                        currentQuestionIndex = currentIndex
                    )
                )
            } catch (e: Exception) {
                // Silencioso em caso de falha transitória (mantém cache em memória)
            }
        }
    }

    private fun showFinishConfirmationDialog() {
        val answeredCount = simulationData.questions.count { it.selectedAlternativeId != null }
        val total = simulationData.questions.size
        val unanswered = total - answeredCount

        val message = if (unanswered > 0) {
            "Você respondeu $answeredCount de $total questões.\nAinda restam $unanswered questões sem resposta.\n\nDeseja realmente finalizar o simulado?"
        } else {
            "Você respondeu todas as $total questões.\n\nDeseja finalizar o simulado e ver seu resultado?"
        }

        AlertDialog.Builder(this)
            .setTitle("Finalizar Simulado")
            .setMessage(message)
            .setPositiveButton("Sim, Finalizar") { _, _ ->
                finishExam()
            }
            .setNegativeButton("Continuar Respondendo", null)
            .show()
    }

    private fun finishExam() {
        binding.pbSavingAnswer.visibility = View.VISIBLE
        binding.btnExamFinish.isEnabled = false

        lifecycleScope.launch {
            try {
                val apiService = ApiClient.getService(this@SimulationExamActivity)
                val response = apiService.finishSimulation(simulationData.id)

                if (response.isSuccessful && response.body()?.result != null) {
                    val result = response.body()!!.result
                    val intent = Intent(this@SimulationExamActivity, SimulationResultActivity::class.java).apply {
                        putExtra("EXTRA_SIMULATION_RESULT", result)
                    }
                    startActivity(intent)
                    finish()
                } else {
                    Toast.makeText(this@SimulationExamActivity, "Erro ao finalizar simulado.", Toast.LENGTH_LONG).show()
                    binding.btnExamFinish.isEnabled = true
                }
            } catch (e: Exception) {
                Toast.makeText(this@SimulationExamActivity, "Erro de rede: ${e.message}", Toast.LENGTH_LONG).show()
                binding.btnExamFinish.isEnabled = true
            } finally {
                binding.pbSavingAnswer.visibility = View.GONE
            }
        }
    }
}
