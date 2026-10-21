package com.tcc.vestibular.ui.profile

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.tcc.vestibular.data.models.HistoryItem
import com.tcc.vestibular.databinding.ItemSubjectQuestionDetailBinding

class SubjectQuestionsAdapter :
    RecyclerView.Adapter<SubjectQuestionsAdapter.SubjectQuestionViewHolder>() {

    private val questions = mutableListOf<HistoryItem>()

    fun setQuestions(newList: List<HistoryItem>) {
        questions.clear()
        questions.addAll(newList)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SubjectQuestionViewHolder {
        val binding = ItemSubjectQuestionDetailBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return SubjectQuestionViewHolder(binding)
    }

    override fun onBindViewHolder(holder: SubjectQuestionViewHolder, position: Int) {
        holder.bind(questions[position])
    }

    override fun getItemCount(): Int = questions.size

    inner class SubjectQuestionViewHolder(private val binding: ItemSubjectQuestionDetailBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(item: HistoryItem) {
            if (item.isCorrect) {
                binding.tvSubjBadge.text = "ACERTOU"
                binding.tvSubjBadge.setBackgroundColor(Color.parseColor("#4CAF50"))
            } else {
                binding.tvSubjBadge.text = "ERROU"
                binding.tvSubjBadge.setBackgroundColor(Color.parseColor("#E53935"))
            }

            binding.tvSubjExamYear.text = "${item.vestibularAcronym} ${item.year}"
            binding.tvSubjStatement.text = item.statement
            binding.tvSubjChosenAnswer.text = "Sua resposta: (${item.chosenLetter}) ${item.chosenText}"
            binding.tvSubjCorrectAnswer.text = "Gabarito oficial: (${item.correctLetter})"
            binding.tvSubjExplanation.visibility = View.GONE
        }
    }
}
