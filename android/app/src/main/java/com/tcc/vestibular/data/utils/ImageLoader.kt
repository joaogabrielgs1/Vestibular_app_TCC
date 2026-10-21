package com.tcc.vestibular.data.utils

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.LruCache
import android.view.View
import android.widget.ImageView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

object ImageLoader {

    private val maxMemory = (Runtime.getRuntime().maxMemory() / 1024).toInt()
    private val cacheSize = maxMemory / 8

    private val memoryCache = object : LruCache<String, Bitmap>(cacheSize) {
        override fun sizeOf(key: String, bitmap: Bitmap): Int {
            return bitmap.byteCount / 1024
        }
    }

    /**
     * Carrega uma imagem de forma assíncrona em uma ImageView.
     * Se url for nula ou vazia, define imageView.visibility = View.GONE.
     */
    fun loadImage(
        imageView: ImageView,
        rawUrl: String?,
        coroutineScope: CoroutineScope
    ) {
        if (rawUrl.isNullOrBlank()) {
            imageView.visibility = View.GONE
            imageView.setImageDrawable(null)
            return
        }

        val fullUrl = if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
            rawUrl
        } else {
            // Se for caminho relativo (ex.: /uploads/...), concatena com o host do back-end
            val baseUrl = "http://192.168.1.102:3000"
            if (rawUrl.startsWith("/")) "$baseUrl$rawUrl" else "$baseUrl/$rawUrl"
        }

        // 1. Verifica cache em memória
        val cachedBitmap = memoryCache.get(fullUrl)
        if (cachedBitmap != null) {
            imageView.setImageBitmap(cachedBitmap)
            imageView.visibility = View.VISIBLE
            return
        }

        // 2. Marca a ImageView com a URL solicitada para evitar reciclagem incorreta
        imageView.tag = fullUrl
        imageView.visibility = View.VISIBLE

        coroutineScope.launch {
            val bitmap = withContext(Dispatchers.IO) {
                try {
                    val connection = URL(fullUrl).openConnection() as HttpURLConnection
                    connection.connectTimeout = 8000
                    connection.readTimeout = 8000
                    connection.doInput = true
                    connection.connect()

                    if (connection.responseCode == HttpURLConnection.HTTP_OK) {
                        connection.inputStream.use { stream ->
                            BitmapFactory.decodeStream(stream)
                        }
                    } else {
                        null
                    }
                } catch (e: Exception) {
                    null
                }
            }

            if (bitmap != null) {
                memoryCache.put(fullUrl, bitmap)
                if (imageView.tag == fullUrl) {
                    imageView.setImageBitmap(bitmap)
                    imageView.visibility = View.VISIBLE
                }
            } else {
                if (imageView.tag == fullUrl) {
                    imageView.visibility = View.GONE
                }
            }
        }
    }
}
