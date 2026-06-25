module BrickFictionI18nFilters
  def bf_lang_url(input, target_lang = nil)
    site = @context.registers[:site]
    config = site.config
    default_lang = (config['default_lang'] || config['lang'] || 'pl').to_s
    active_lang = (target_lang || config['active_lang'] || default_lang).to_s
    languages = Array(config['languages']).map(&:to_s)
    url = input.to_s

    return url if url.empty? || external_url?(url)

    path, suffix = split_url_suffix(url)
    baseurl = config['baseurl'].to_s
    path = path.delete_prefix(baseurl) if !baseurl.empty? && path.start_with?(baseurl)
    path = "/#{path}" unless path.start_with?('/')
    path = strip_language_prefix(path, languages)

    localized_path = if active_lang == default_lang
                       path
                     elsif path == '/'
                       "/#{active_lang}/"
                     else
                       "/#{active_lang}#{path}"
                     end

    "#{localized_path}#{suffix}"
  end

  private

  def external_url?(url)
    url.start_with?('#', '//') || url.match?(/\A[a-z][a-z0-9+\-.]*:/i)
  end

  def split_url_suffix(url)
    query_index = url.index('?')
    hash_index = url.index('#')
    suffix_index = [query_index, hash_index].compact.min

    return [url, ''] unless suffix_index

    [url[0...suffix_index], url[suffix_index..]]
  end

  def strip_language_prefix(path, languages)
    languages.reduce(path) do |current_path, lang|
      prefix = "/#{lang}"
      if current_path == prefix
        '/'
      elsif current_path.start_with?("#{prefix}/")
        current_path.delete_prefix(prefix)
      else
        current_path
      end
    end
  end
end

Liquid::Template.register_filter(BrickFictionI18nFilters)
