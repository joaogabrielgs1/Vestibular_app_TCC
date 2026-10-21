package com.tcc.vestibular.ui.simulation

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.tcc.vestibular.data.models.SimulationReviewQuestion
import com.tcc.vestibular.databinding.ItemSimulationReviewBinding

class SimulationQuestionReviewAdapter(
    private val questions: List<SimulationReviewQuestion>
) : RecyclerView.Adapter<SimulationQuestionReviewAdapter.ReviewViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ReviewViewHolder {
        val binding = ItemSimulationReviewBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ReviewViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ReviewViewHolder, position: Int) {
        holder.bind(questions[position])
    }

    override fun getItemCount(): Int = questions.size

    inner class ReviewViewHolder(private val binding: ItemSimulationReviewBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(q: SimulationReviewQuestion) {
            val isCorrect = q.isCorrect == true

            if (isCorrect) {
                binding.tvReviewStatusBadge.text = "ACERTOU"
                binding.tvReviewStatusBadge.setBackgroundColor(Color.parseColor("#4CAF50"))
            } else {
                binding.tvReviewStatusBadge.text = "ERROU"
                binding.tvReviewStatusBadge.setBackgroundColor(Color.parseColor("#E53935"))
            }

            binding.tvReviewQuestionHeader.text = "Questão ${q.orderIndex + 1} • ${q.vestibularAcronym} ${q.year} • ${q.subjectName}"
            binding.tvReviewStatement.text = q.statement

            // Carrega imagem se existir na questão do simulado
            com.tcc.vestibular.data.utils.ImageLoader.loadImage(
                binding.ivReviewQuestionImage,
                q.imageUrl,
                kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.Main)
            )

            val chosenText = if (q.chosenLetter != null) {
                "Sua resposta: (${q.chosenLetter}) ${q.chosenText ?: ""}"
            } else {
                "Sua resposta: (Não respondida)"
            }
            binding.tvReviewChosenAnswer.text = chosenText

            val correctText = "Gabarito: (${q.correctLetter ?: ""}) ${q.correctText ?: ""}"
            binding.tvReviewCorrectAnswer.text = correctText

            if (!q.explanation.isNullOrBlank()) {
                binding.tvReviewExplanation.text = "Explicação: ${q.explanation}"
                binding.tvReviewExplanation.visibility = View.VISIBLE
            } else {
                binding.tvReviewExplanation.visibility = View.GONE
            }
        }
    }
}
