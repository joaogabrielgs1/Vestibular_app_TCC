package com.tcc.vestibular.ui.history

import android.graphics.Color
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.tcc.vestibular.data.models.HistoryItem
import com.tcc.vestibular.databinding.ItemHistoryBinding

class HistoryAdapter : RecyclerView.Adapter<HistoryAdapter.HistoryViewHolder>() {

    private val historyList = mutableListOf<HistoryItem>()

    fun setHistory(newList: List<HistoryItem>) {
        historyList.clear()
        historyList.addAll(newList)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): HistoryViewHolder {
        val binding = ItemHistoryBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return HistoryViewHolder(binding)
    }

    override fun onBindViewHolder(holder: HistoryViewHolder, position: Int) {
        holder.bind(historyList[position])
    }

    override fun getItemCount(): Int = historyList.size

    inner class HistoryViewHolder(private val binding: ItemHistoryBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(item: HistoryItem) {
            if (item.isCorrect) {
                binding.tvHistoryResultBadge.text = "ACERTOU"
                binding.tvHistoryResultBadge.setBackgroundColor(Color.parseColor("#4CAF50"))
            } else {
                binding.tvHistoryResultBadge.text = "ERROU"
                binding.tvHistoryResultBadge.setBackgroundColor(Color.parseColor("#E53935"))
            }

            binding.tvHistoryExamInfo.text = "${item.vestibularAcronym} ${item.year} • ${item.subjectName}"
            binding.tvHistoryStatement.text = item.statement
            val chosen = item.chosenLetter ?: "-"
            val correct = item.correctLetter ?: "-"
            binding.tvHistoryDetails.text = "Sua resposta: ($chosen) | Correta: ($correct)"
        }
    }
}
