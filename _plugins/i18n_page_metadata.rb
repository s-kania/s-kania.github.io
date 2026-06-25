module BrickFictionI18nPageMetadata
  Jekyll::Hooks.register [:pages, :documents], :pre_render do |item|
    site = item.site
    active_lang = active_lang(site)
    item_lang = item.data['lang']

    next if item_lang && item_lang.to_s != active_lang

    item.data['lang'] ||= active_lang
    item.data['canonical_url'] ||= canonical_url(site, item, active_lang)
    next if post_document?(item)

    item.data['description'] = localized_site_description(site) if blank?(item.data['description'])
  end

  class << self
    private

    def active_lang(site)
      (site.config['active_lang'] || default_lang(site)).to_s
    end

    def default_lang(site)
      (site.config['default_lang'] || site.config['lang'] || 'pl').to_s
    end

    def localized_site_description(site)
      locales = site.data['locales'] || {}
      locales.dig(active_lang(site), 'site_meta', 'description') || site.config['description']
    end

    def canonical_url(site, item, lang)
      "#{site_url(site)}#{localized_path(site, item_url(item), lang)}"
    end

    def site_url(site)
      url = site.config['url'].to_s.sub(%r{/\z}, '')
      baseurl = site.config['baseurl'].to_s.sub(%r{/\z}, '')

      "#{url}#{baseurl}"
    end

    def item_url(item)
      url = item.respond_to?(:url) ? item.url : item.data['permalink']
      normalize_path(url.to_s.empty? ? '/' : url.to_s)
    end

    def localized_path(site, path, lang)
      default = default_lang(site)
      stripped = strip_language_prefix(path, site)

      return stripped if lang == default
      return "/#{lang}/" if stripped == '/'

      "/#{lang}#{stripped}"
    end

    def strip_language_prefix(path, site)
      normalized = normalize_path(path)

      languages(site).reduce(normalized) do |current, lang|
        prefix = "/#{lang}"
        if current == prefix
          '/'
        elsif current.start_with?("#{prefix}/")
          current.delete_prefix(prefix)
        else
          current
        end
      end
    end

    def normalize_path(path)
      normalized = path.start_with?('/') ? path : "/#{path}"
      normalized = normalized.sub(%r{/index\.html\z}, '/')
      normalized.end_with?('/') ? normalized : "#{normalized}/"
    end

    def languages(site)
      Array(site.config['languages']).map(&:to_s)
    end

    def post_document?(item)
      item.respond_to?(:collection) && item.collection && item.collection.label == 'posts'
    end

    def blank?(value)
      value.nil? || value.to_s.strip.empty?
    end
  end
end
