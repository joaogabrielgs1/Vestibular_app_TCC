package com.tcc.vestibular.ui.questions

import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.widget.RadioButton
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.tcc.vestibular.data.api.ApiClient
import com.tcc.vestibular.data.models.Question
import com.tcc.vestibular.data.models.SubmitAnswerRequest
import com.tcc.vestibular.databinding.ActivityQuestionDetailBinding
import kotlinx.coroutines.launch

class QuestionDetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityQuestionDetailBinding
    private var question: Question? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityQuestionDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        question = intent.getSerializableExtra("EXTRA_QUESTION") as? Question

        if (question == null) {
            Toast.makeText(this, "Questão não encontrada.", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        renderQuestion()

        binding.btnSubmitAnswer.setOnClickListener {
            submitAnswer()
        }
    }

    private fun renderQuestion() {
        val q = question!!
        binding.tvDetailHeader.text = "${q.vestibularAcronym} ${q.year} • ${q.subjectName}"
        binding.tvDetailStatement.text = q.statement

        // Carrega imagem se existir
        com.tcc.vestibular.data.utils.ImageLoader.loadImage(
            binding.ivQuestionImage,
            q.imageUrl,
            lifecycleScope
        )

        binding.rgAlternatives.removeAllViews()
        q.alternatives.forEach { alt ->
            val radioButton = RadioButton(this).apply {
                id = alt.id
                text = "(${alt.letter}) ${alt.text}"
                textSize = 15f
                setPadding(12, 16, 12, 16)
            }
            binding.rgAlternatives.addView(radioButton)
        }
    }

    private fun submitAnswer() {
        val selectedId = binding.rgAlternatives.checkedRadioButtonId

        if (selectedId == -1) {
            Toast.makeText(this, "Selecione uma alternativa antes de responder.", Toast.LENGTH_SHORT).show()
            return
        }

        binding.detailProgressBar.visibility = View.VISIBLE
        binding.btnSubmitAnswer.isEnabled = false

        lifecycleScope.launch {
            try {
                val apiService = ApiClient.getService(this@QuestionDetailActivity)
                val response = apiService.submitAnswer(
                    SubmitAnswerRequest(
                        questionId = question!!.id,
                        alternativeId = selectedId
                    )
                )

                if (response.isSuccessful && response.body() != null) {
                    val result = response.body()!!

                    binding.cardResult.visibility = View.VISIBLE
                    if (result.isCorrect) {
                        binding.tvResultStatus.text = "✓ Parabéns, você acertou!"
                        binding.tvResultStatus.setTextColor(Color.parseColor("#4CAF50"))
                    } else {
                        binding.tvResultStatus.text = "✗ Você errou!"
                        binding.tvResultStatus.setTextColor(Color.parseColor("#E53935"))
                    }

                    binding.tvCorrectAlternative.text = "Gabarito: Alternativa ${result.correctLetter ?: ""}"
                    binding.tvExplanation.text = result.explanation ?: "Sem explicação cadastrada para esta questão."

                    // Desabilita seleção após responder
                    for (i in 0 until binding.rgAlternatives.childCount) {
                        binding.rgAlternatives.getChildAt(i).isEnabled = false
                    }
                } else {
                    Toast.makeText(this@QuestionDetailActivity, "Erro ao enviar resposta.", Toast.LENGTH_SHORT).show()
                    binding.btnSubmitAnswer.isEnabled = true
                }
            } catch (e: Exception) {
                Toast.makeText(this@QuestionDetailActivity, "Falha de rede: ${e.message}", Toast.LENGTH_SHORT).show()
                binding.btnSubmitAnswer.isEnabled = true
            } finally {
                binding.detailProgressBar.visibility = View.GONE
            }
        }
    }
}
